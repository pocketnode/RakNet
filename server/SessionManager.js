const Session = require("./Session");

const BinaryStream = require("pocketnode-binarystream");

const OfflineMessage = require("../protocol/OfflineMessage");
const OfflineMessageHandler = require("./OfflineMessageHandler");

const BITFLAG = require("../protocol/BitFlags");
const ACK = require("../protocol/ACK");
const NACK = require("../protocol/NACK");
const Datagram = require("../protocol/Datagram");

const PacketPool = require("./PacketPool");

class SessionManager {
    static get RAKNET_TPS(){return 100}
    static get RAKNET_TICK_LENGTH(){return 1 / SessionManager.RAKNET_TPS}

    initVars(){
        this._packetPool = new PacketPool();

        this._server = null;
        this._socket = null;

        this._bytes = {
            received: 0,
            sent: 0
        };

        this._sessions = new Map();
        
        this._offlineMessageHandler = null;
        
        this._shutdown = false;

        this._ticks = 0;
        this._lastMeasure = -1;

        this._blocked = new Map();

        this.portChecking = false;

        this.startTime = -1;

        this._outgoingMessages = [];
    }

    constructor(server, socket) {
        this.initVars();

        this._server = server;
        this._socket = socket;

        this._startTime = Date.now();

        this._offlineMessageHandler = new OfflineMessageHandler(this);

        this.start();
    }

    start(){
        this._socket.getSocket().on("message", (msg, rinfo) => {
            this._bytes.received += msg.length;

            if(this._blocked.has(rinfo.address)){
                return;
            }

            if(msg.length < 1){
                return;
            }

            let stream = new BinaryStream(msg);

            let packetId = stream.getBuffer()[0];

            //this.logger.debug("Received", packetId, "with length of", msg.length, "from", rinfo.address + ":" + rinfo.port);

            this.handle(packetId, stream, rinfo.address, rinfo.port);
        });

        this.tickProcessor();
    }

    getTimeSinceStart(){
        return Date.now() - this._startTime;
    }

    getPort(){
        return this._server.getPort();
    }

    getLogger(){
        return this._server.getLogger();
    }

    shutdown(){
        this._shutdown = true;
    }

    tickProcessor(){
        this._lastMeasure = Date.now();

        let int = setInterval(() => {
            if(!this._shutdown){
                this.tick();
            }else{
                clearInterval(int);
            }
        }, SessionManager.RAKNET_TICK_LENGTH * 1000);
    }

    tick(){
        let time = Date.now();

        for(let [,session] of this._sessions){
            session.update(time);
        }

        if((this._ticks % SessionManager.RAKNET_TPS) === 0){
            let diff = Math.max(0.005, time - this._lastMeasure);
            let bandwidth = {
                up: this._bytes.sent / diff,
                down: this._bytes.received / diff
            };

            this._lastMeasure = time;
            this._bytes.sent = 0;
            this._bytes.received = 0;

            if(this._blocked.size > 0){
                let now = Date.now();
                for(let [address, timeout] of this._blocked){
                    if(timeout <= now){
                        this._blocked.delete(address);
                    }else{
                        break;
                    }
                }
            }
        }

        ++this._ticks;
    }

    getId(){
        return this._server.getId();
    }

    getServerName(){
        return this._server.getServerName();
    }

    sendPacket(packet, address, port){

        packet.encode();
        if(address instanceof Session) this._bytes.sent += this._socket.sendBuffer(packet.getStream().getBuffer(), address.getAddress(), address.getPort());
        else this._bytes.sent += this._socket.sendBuffer(packet.getStream().getBuffer(), address, port);

        //this.getLogger().debug("Sent "+protocol.constructor.name+"("+protocol.stream.buffer.toString("hex")+") to "+address+":"+port);
    }

    createSession(address, port, clientId, mtuSize){
        let session = new Session(this, address, port, clientId, mtuSize);
        this._sessions.set(SessionManager.hashAddress(address, port), session);
        this.getLogger().debug(`Created session for ${session.toString()} with MTU size ${mtuSize}`);
        return session;
    }

    sessionExists(address, port){
        if(address instanceof Session) return this._sessions.has(SessionManager.hashAddress(address.getAddress(), address.getPort()));
        else return this._sessions.has(SessionManager.hashAddress(address, port));
    }

    removeSession(session, reason = "unknown"){
        let id = SessionManager.hashAddress(session.getAddress(), session.getPort());
        if(this._sessions.has(id)){
            this._sessions.get(id).close();
            this.removeSessionInternal(this);
            this.sendOutgoingMessage({
                purpose: "closeSession",
                data: {
                    identifier: id,
                    reason: reason
                }
            });
        }
    }

    removeSessionInternal(session){
        this._sessions.delete(session.toString());
    }

    getSession(address, port){
        if(this.sessionExists(address, port)) return this._sessions.get(SessionManager.hashAddress(address, port));
        else return null;
    }

    getSessionByIdentifier(identifier){
        return this._sessions.get(identifier);
    }

    getSessions(){
        return Array.from(this._sessions.values());
    }

    openSession(session){
        this.sendOutgoingMessage({
            purpose: "openSession",
            data: {
                identifier: session.toString(),
                ip: session.getAddress(),
                port: session.getPort(),
                clientId: session.clientId
            }
        });
    }

    handle(packetId, stream, ip, port){
        let session = this.getSession(ip, port);

        //console.log("got packet!", stream);

        if(session === null){
            let packet = this._packetPool.getPacket(packetId);
            if(packet !== null && (packet = new packet(stream))){
                if(packet instanceof OfflineMessage){
                    packet.decode();
                    if(packet.validMagic()){
                        if(!this._offlineMessageHandler.handle(packet, ip, port)){
                            this.getLogger().debug("Received unhandled offline message " + packet.constructor.name + " from " + session);
                        }
                    }else{
                        this.getLogger().debug("Received invalid message from " + session + ":", "0x" + packet.getBuffer().toString("hex"));
                    }
                }
            }
        }else{
            if((packetId & BITFLAG.VALID) === 0){
                this.getLogger().debug("Ignored non-connected message for " + session + " due to session already opened");
            }else{
                if(packetId & BITFLAG.ACK){
                    session.handlePacket(new ACK(stream));
                }else if(packetId & BITFLAG.NAK){
                    session.handlePacket(new NACK(stream));
                }else{
                    session.handlePacket(new Datagram(stream));
                }
            }
        }
    }

    blockAddress(address, timeout = 300){
        let final = Date.now() + timeout;
        if(!this._blocked.has(address) || timeout !== -1){
            if(timeout === -1){
                let final = Number.MAX_SAFE_INTEGER;
            }else{
                this.getLogger().notice(`Blocked ${address} for ${timeout} seconds`);
            }
            this._blocked.set(address, final);
        }else if(this._blocked.get(address) < final){
            this._blocked.set(address, final);
        }
    }

    unblockAddress(address){
        this._blocked.delete(address);
        this.getLogger().debug(`Unblocked ${address}`);
    }

    sendOutgoingMessage(message){
        this._outgoingMessages.push(message);
    }

    readOutgoingMessages(){
        let tmp = this._outgoingMessages;
        this._outgoingMessages = [];
        return tmp;
    }

    static hashAddress(ip, port){
        return `${ip}:${port}`;
    }
}

module.exports =  SessionManager;