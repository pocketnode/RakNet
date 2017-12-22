const Session = require("./Session");

const OfflineMessage = require("../protocol/OfflineMessage");
const OfflineMessageHandler = require("./OfflineMessageHandler");

const BITFLAG = require("../protocol/BitFlags");
const ACK = require("../protocol/ACK");
const NACK = require("../protocol/NACK");
const Datagram = require("../protocol/Datagram");

const RAKNET_TPS = 100;
const RAKNET_TICK_LENGTH = 1 / RAKNET_TPS;

class SessionManager {
    initVars(){
        this.server = {};
        this.socket = {};

        this.bytes = {
            received: 0,
            sent: 0
        };

        this.hasShutdown = false;

        this.ticks = 0;
        this.lastMeasure = -1;

        this.startTime = -1;

        this.sessions = new Map();

        this.offlineMessageHandler = {};
    }

    constructor(server, socket) {
        this.initVars();

        this.server = server;
        this.socket = socket;

        this.startTime = Date.now();

        this.offlineMessageHandler = new OfflineMessageHandler(this);

        this.start();
    }

    start(){
        this.tickProcessor();
    }

    shutdown(){
        this.hasShutdown = true;
    }

    tickProcessor(){
        this.lastMeasure = Date.now();

        let int = setInterval(() => {
            if(!this.hasShutdown){
                this.tick();
            }else{
                clearInterval(int);
            }
        }, RAKNET_TICK_LENGTH * 1000);
    }

    tick(){
        let time = Date.now();

        for(let [,session] of this.sessions){
            session.update(time);
        }

        if((this.ticks % RAKNET_TPS) === 0){
            this.lastMeasure = time;
            this.bytes.sent = 0;
            this.bytes.received = 0;

            //if blocked check timeout
        }

        ++this.ticks;
    }

    getTimeSinceStart(){
        return Date.now() - this.startTime;
    }

    getPort(){
        return this.server.getPort();
    }

    getLogger(){
        return this.server.getLogger();
    }

    getId(){
        return this.server.getId();
    }

    getName(){
        return {
            motd: this.server.pocketnode.getMotd(),
            name: this.server.pocketnode.getName(),
            protocol: this.server.pocketnode.getProtocol(),
            version: this.server.pocketnode.getVersion(),
            players: {
                online: this.server.pocketnode.getOnlinePlayerCount(),
                max: this.server.pocketnode.getMaxPlayers()
            },
            gamemode: this.server.pocketnode.getGamemodeName(),
            serverId: this.server.pocketnode.getServerId()
        };
    }

    sendPacket(packet, address, port){
        packet.encode();
        if(address instanceof Session){
            this.bytes.sent += this.socket.getSocket().send(packet.getBuffer(), 0, packet.getBuffer().length, address.getPort(), address.getAddress());
            //this.getLogger().debug("Sent "+packet.constructor.name+"("+packet.stream.buffer.toString("hex")+") to "+address);
        }else{
            this.bytes.sent += this.socket.getSocket().send(packet.getBuffer(), 0, packet.getBuffer().length, port, address);
            //this.getLogger().debug("Sent "+packet.constructor.name+"("+packet.stream.buffer.toString("hex")+") to "+address+":"+port);
        }
    }

    createSession(address, port, clientId, mtuSize){
        let session = new Session(this, address, port, clientId, mtuSize);
        this.sessions.set(address + ":" + port, session);
        return session;
    }

    sessionExists(address, port){
        return this.sessions.has(address + ":" + port);
    }

    removeSession(session, reason = "unknown"){
        session.close();
        //PocketNode.tell(new InterfaceMessage("playerDisconnect", {reason:reason}))
        this.getLogger().debug("Removed "+session+" because of "+reason);
        return this.sessions.delete(session.toString());
    }

    getSession(address, port){
        if(this.sessionExists(address, port)) return this.sessions.get(address + ":" + port);
        else return null;
    }

    handle(packetId, stream, ip, port){
        let session = this.getSession(ip, port);

        if(session === null){
            let packet = this.server.getPacketPool().getPacket(packetId);
            if(packet !== null && (packet = new packet(stream))){
                if(packet instanceof OfflineMessage){
                    packet.decode();
                    if(packet.validMagic()){
                        if(!this.offlineMessageHandler.handle(packet, ip, port)){
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
}

module.exports =  SessionManager;