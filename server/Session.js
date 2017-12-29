const Packet = require("../protocol/Packet");

const RakNet = require("../RakNet");
const BinaryStream = require("../BinaryStream");

const Datagram = require("../protocol/Datagram");
const EncapsulatedPacket = require("../protocol/EncapsulatedPacket");
const ConnectionRequest = require("../protocol/ConnectionRequest");
const ConnectionRequestAccepted = require("../protocol/ConnectionRequestAccepted");
const NewIncomingConnection = require("../protocol/NewIncomingConnection");
const ConnectedPing = require("../protocol/ConnectedPing");
const ConnectedPong = require("../protocol/ConnectedPong");
const DisconnectionNotification = require("../protocol/DisconnectionNotification");

const PacketReliability = require("../protocol/PacketReliability");

const ACK = require("../protocol/ACK");
const NACK = require("../protocol/NACK");

const RecoveryQueue = require("./queues/RecoveryQueue");
const ACKQueue = require("./queues/ACKQueue");
const NACKQueue = require("./queues/NACKQueue");
const SplitQueue = require("./queues/SplitQueue");
const PacketBatchHolder = require("./queues/PacketBatchHolder");

const MessageIdentifiers = require("../protocol/MessageIdentifiers");

const SessionState = {
    CONNECTING: 0,
    CONNECTED: 1,
    DISCONNECTING: 2,
    DISCONNECTED: 3
};

class Session {
    get MAX_SPLIT_SIZE(){
        return 128;
    }

    get MAX_SPLIT_COUNT(){
        return 4;
    }

    initVars(){
        this.sessionManager = {};

        this.address = "";
        this.port = -1;
        this.state = SessionState.CONNECTING;
        this.mtuSize = -1;
        this.clientId = -1;

        this.lastSequenceNumber = -1;
        this.currentSequenceNumber = 0;

        this.messageIndex = 0;
        this.channelIndex = [];

        this.splitId = 0;

        this.lastUpdate = 0;
        this.disconnectionTime = -1;

        this.isActive = false;

        this.packetsToSend = [];

        this._sendQueue = {};
        this.recoveryQueue = new RecoveryQueue();
        this.ACKQueue = new ACKQueue();
        this.NACKQueue = new NACKQueue();
        this.splitQueue = new SplitQueue();
        this.packetBatches = new PacketBatchHolder();

        this.lastPingMeasure = 1;
    }

    constructor(sessionManager, address, port, clientId, mtuSize){
        this.initVars();
        this.sessionManager = sessionManager;

        this.address = address;
        this.port = port;
        this.clientId = clientId;
        this.mtuSize = mtuSize;

        this.setSendQueue();

        this.lastUpdate = Date.now();
    }

    setSendQueue(){
        this._sendQueue = new Datagram();
        this._sendQueue.needsBAndAs = true;
    }

    getAddress(){
        return this.address;
    }

    getPort(){
        return this.port;
    }

    getClientId(){
        return this.clientId;
    }

    isConnecting(){
        return this.state === SessionState.CONNECTING;
    }

    isConnected(){
        return this.state !== SessionState.DISCONNECTING && this.state !== SessionState.DISCONNECTED;
    }

    setConnected(){
        this.state = SessionState.CONNECTED;
        this.lastUpdate = Date.now();
        this.sessionManager.getLogger().debug(this+" is now connected.");
    }

    update(time){
        if(!this.isActive && (this.lastUpdate + 10000) < time){
            this.disconnect("timeout");
            return;
        }

        if(this.state === SessionState.DISCONNECTING && (
            (this.ACKQueue.isEmpty() && this.NACKQueue.isEmpty() && this.packetsToSend.length === 0 && this.recoveryQueue.isEmpty()) &&
            this.disconnectionTime + 10 < time)
        ){
            this.close();
            return;
        }

        this.isActive = false;

        if(!this.ACKQueue.isEmpty()){
            let pk = new ACK();
            pk.packets = this.ACKQueue.getAll();
            this.sendPacket(pk);
            this.ACKQueue.clear();
        }

        if(!this.NACKQueue.isEmpty()){
            let pk = new NACK();
            pk.packets = this.NACKQueue.getAll();
            this.sendPacket(pk);
            this.NACKQueue.clear();
        }

        if(this.packetsToSend.length > 0){
            let limit = 16;
            for(let k in this.packetsToSend){
                this.sendDatagram(this.packetsToSend[k]);
                delete this.packetsToSend[k];

                if(--limit <= 0){
                    break;
                }
            }
        }

        if(this.lastPingTime + 5000 < time){
            this.sendPing();
            this.lastPingTime = time;
        }

        this.sendQueue();
    }


    close(){
        if(this.state !== SessionState.DISCONNECTED){
            this.state = SessionState.DISCONNECTED;

            this.sessionManager.getLogger().debug("Closed session for "+this);
            //close player in pocketnode
            this.sessionManager = null;
        }
    }

    disconnect(reason = "unknown"){
        this.sessionManager.removeSession(this, reason);
    }

    handlePacket(packet){
        this.isActive = true;
        this.lastUpdate = Date.now();

        if(packet instanceof Datagram || packet instanceof ACK || packet instanceof NACK){
            //this.sessionManager.getLogger().debug("Got " + protocol.constructor.name + "(" + protocol.stream.buffer.toString("hex") + ") from " + this);
        }

        if(packet instanceof Datagram){
            packet.decode();

            let diff = packet.sequenceNumber - this.lastSequenceNumber;

            if(!this.NACKQueue.isEmpty()){
                this.NACKQueue.remove(packet.sequenceNumber);
                if(diff !== 1){
                    for(let i = this.lastSequenceNumber + 1; i < packet.sequenceNumber; i++){
                        this.NACKQueue.add(i);
                    }
                }
            }

            this.ACKQueue.add(packet.sequenceNumber);

            if(diff >= 1){
                this.lastSequenceNumber = packet.sequenceNumber;
            }

            packet.packets.forEach(pk => this.handleEncapsulatedPacket(pk));
        }else{
            if(packet instanceof ACK){
                packet.decode();
                this.recoveryQueue.recover(packet.packets).forEach(datagram => {
                    this.recoveryQueue.remove(datagram.sequenceNumber);
                });
            }else if(packet instanceof NACK){
                packet.decode();
                this.recoveryQueue.recover(packet.packets).forEach(datagram => {
                    this.packetsToSend.push(datagram);
                    this.recoveryQueue.remove(datagram.sequenceNumber);
                });
            }
        }
    }

    handleEncapsulatedPacket(packet){
        if(!(packet instanceof EncapsulatedPacket)) throw new TypeError("Expecting EncapsulatedPacket, got "+(packet.constructor.name ? packet.constructor.name : packet));

        //this.sessionManager.getLogger().debug("Handling EncapsulatedPacket("+protocol.getBuffer().toString("hex")+")["+protocol.getBuffer().length+"] from "+this);

        if(packet.hasSplit){
            if(this.isConnected()) this.handleSplitPacket(packet);
            return;
        }

        let id = packet.getBuffer()[0];
        let dpk, pk;
        switch(id){
            case ConnectionRequest.getId():
                this.sessionManager.getLogger().debug("Got ConnectionRequest from "+this);
                dpk = new ConnectionRequest(packet.getStream());
                dpk.decode();

                this.clientId = dpk.clientId;

                pk = new ConnectionRequestAccepted();
                pk.address = this.getAddress();
                pk.port = this.getPort();
                pk.sendPingTime = dpk.sendPingTime;
                pk.sendPongTime = this.sessionManager.getTimeSinceStart();
                this.queueConnectedPacket(pk, PacketReliability.UNRELIABLE, 0, RakNet.PRIORITY_IMMEDIATE);
                break;

            case NewIncomingConnection.getId():
                this.sessionManager.getLogger().debug("Got NewIncomingConnection from "+this);

                dpk = new NewIncomingConnection(packet.getStream());
                dpk.decode();

                if(true || dpk.port === this.sessionManager.getPort()){//todo: if port checking
                    this.setConnected();

                    this.sessionManager.openSession(this);

                    this.sendPing();
                }
                break;

            case ConnectedPing.getId():
                dpk = new ConnectedPing(packet.getStream());
                dpk.decode();

                pk = new ConnectedPong();
                pk.sendPingTime = dpk.sendPingTime;
                pk.sendPongTime = this.sessionManager.getTimeSinceStart();
                this.queueConnectedPacket(pk, PacketReliability.UNRELIABLE, 0);
                break;

            case ConnectedPong.getId():
                dpk = new ConnectedPong(packet.getStream());
                dpk.decode();

                this.handlePong(dpk.sendPingTime, dpk.sendPongTime);
                break;

            case DisconnectionNotification.getId():
                this.disconnect("client disconnect"); //supposed to send ack
                break;

            case MessageIdentifiers.MINECRAFT_HEADER:
                this.packetBatches.add(packet);
                this.sessionManager.getLogger().debug("Got a Minecraft packet");
                break;

            default:
                this.packetBatches.add(packet);
                this.sessionManager.getLogger().debug("Got unknown packet: ", id);
                break;
        }
    }

    handlePong(ping, pong){
        this.lastPingMeasure = this.sessionManager.getTimeSinceStart() - ping;
    }

    handleSplitPacket(packet){
        if(!(packet instanceof EncapsulatedPacket)) throw new TypeError("Expecting EncapsulatedPacket, got "+(packet.constructor.name ? packet.constructor.name : packet));

        if(packet.splitCount >= this.MAX_SPLIT_SIZE || packet.splitIndex >= this.MAX_SPLIT_SIZE || packet.splitIndex < 0){
            return;
        }

        if(this.splitQueue.size >= this.MAX_SPLIT_COUNT) return;
        this.splitQueue.add(packet);

        if(this.splitQueue.getSplitSize(packet.splitId) === packet.splitCount){
            let pk = new EncapsulatedPacket();
            let stream = new BinaryStream();
            let packets = this.splitQueue.getSplits(packet.splitId);
            for(let [splitIndex, packet] of packets){
                stream.append(packet.getBuffer());
            }
            this.splitQueue.remove(packet.splitId);

            pk.stream = stream.flip();
            pk.length = stream.offset;

            this.handleEncapsulatedPacket(pk);
        }
    }

    sendPacket(pk){
        if(pk instanceof Packet){
            this.sessionManager.sendPacket(pk, this);
            return true;
        }
        return false;
    }

    sendDatagram(datagram){
        if(!(datagram instanceof Datagram)) throw new TypeError("Expecting Datagram, got "+(datagram.constructor.name ? datagram.constructor.name : datagram));

        if(datagram.sequenceNumber !== null){
            this.recoveryQueue.remove(datagram.sequenceNumber);
        }
        datagram.sequenceNumber = this.currentSequenceNumber++;
        datagram.sendTime = Date.now();
        this.recoveryQueue.addRecoveryFor(datagram);
        this.sendPacket(datagram);
    }

    sendPing(reliability = PacketReliability.UNRELIABLE){
        let pk = new ConnectedPing();
        pk.sendPingTime = this.sessionManager.getTimeSinceStart();
        this.queueConnectedPacket(pk, reliability, 0, RakNet.PRIORITY_IMMEDIATE);
    }

    queueConnectedPacket(packet, reliability, orderChannel, flags = RakNet.PRIORITY_NORMAL){
        if(!(packet instanceof Packet)) throw new TypeError("Expecting Packet, got "+(packet.constructor.name ? packet.constructor.name : packet));
        packet.encode();

        let pk = new EncapsulatedPacket();
        pk.reliability = reliability;
        pk.orderChannel = orderChannel;
        pk.stream = new BinaryStream(packet.getBuffer());

        //this.sessionManager.getLogger().debug("Queuing "+protocol.constructor.name+"("+protocol.getBuffer().toString("hex")+")");

        this.addEncapsulatedToQueue(pk, flags);
    }

    addEncapsulatedToQueue(packet, flags){
        if(!(packet instanceof EncapsulatedPacket)) throw new TypeError("Expecting EncapsulatedPacket, got "+(packet.constructor.name ? packet.constructor.name : packet));

        if(packet.isReliable()){
            packet.messageIndex = this.messageIndex++;
        }

        if(packet.isSequenced()){
            packet.orderIndex = this.channelIndex[packet.orderChannel]++;
        }

        let maxSize = this.mtuSize - 60;

        if(packet.getBuffer().length > maxSize){
            let splitId = ++this.splitId % 65536;
            let splitIndex = 0;
            let splitCount = Math.ceil(packet.getBuffer().length / maxSize);
            while(!packet.getStream().feof()){
                let stream = packet.getBuffer().slice(packet.getStream().offset, packet.getStream().offset += maxSize);
                let pk = new EncapsulatedPacket();
                pk.splitId = splitId;
                pk.hasSplit = true;
                pk.splitCount = splitCount;
                pk.reliability = packet.reliability;
                pk.splitIndex = splitIndex;
                pk.stream = stream;

                if (splitIndex > 0) {
                    pk.messageIndex = this.messageIndex++;
                } else {
                    pk.messageIndex = packet.messageIndex;
                }

                pk.orderChannel = packet.orderChannel;
                pk.orderIndex = packet.orderIndex;

                this.addToQueue(pk, flags | RakNet.PRIORITY_IMMEDIATE);
                splitIndex++;
            }
        }else{
            this.addToQueue(packet, flags);
        }
    }

    addToQueue(pk, flags = RakNet.PRIORITY_NORMAL){
        let priority = flags & 0x07;

        let length = this._sendQueue.getLength();
        if((length + pk.getLength()) > (this.mtuSize - 36)){
            this.sendQueue();
        }

        if(pk.needACK){
            this._sendQueue.packets.push(Object.assign(new EncapsulatedPacket(), pk));
            pk.needACK = false;
        }else{
            this._sendQueue.packets.push(pk.toBinary());
        }

        if(priority === RakNet.PRIORITY_IMMEDIATE){
            this.sendQueue();
        }
    }

    sendQueue(){
        if(this._sendQueue.packets.length > 0){
            this.sendDatagram(this._sendQueue);
            this.setSendQueue();
        }
    }

    toString(){
        return this.address + ":" + this.port;
    }
}

module.exports = Session;