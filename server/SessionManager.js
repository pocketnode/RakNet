const Session = require("./Session");
const TempSession = require("./TempSession");

const OfflineMessage = require("../protocol/OfflineMessage");
const OfflineMessageHandler = require("./OfflineMessageHandler");

const Datagram = require("../protocol/Datagram");

class SessionManager {
    initVars(){
        this.server = {};
        this.socket = {};

        this.bytes = {
            received: 0,
            sent: 0
        };

        this.sessions = new Map();

        this.offlineMessageHandler = {};
    }

    constructor(server, socket){
        this.initVars();

        this.server = server;
        this.socket = socket;

        this.offlineMessageHandler = new OfflineMessageHandler(this);
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

    sendPacket(packet, session){
        packet.encode();
        this.bytes.sent += this.socket.getSocket().send(packet.getBuffer(), 0, packet.getBuffer().length, session.getPort(), session.getAddress());
    }

    createSession(address, port, clientId, mtuSize){
        let session = new Session(address, port, clientId, mtuSize);
        this.sessions.set(address + ":" + port, session);
        return session;
    }

    sessionExists(address, port){
        return this.sessions.has(address + ":" + port);
    }

    getSession(address, port){
        if(this.sessionExists(address, port)){
            return this.sessions.get(address + ":" + port);
        }else{
            return false;
        }
    }

    handle(packet, tsession){
        packet.decode();
        if(packet instanceof OfflineMessage){
            this.offlineMessageHandler.handle(packet, tsession);
        }else if(packet instanceof Datagram){
            if(this.sessionExists(tsession.getAddress(), tsession.getPort())){
                this.getLogger().debug("Got Datagram for " + tsession);
                console.log(packet);
                console.log("Encoding the packet..");
                packet.buffer = new (require("../ByteBuffer"))();
                packet.encode();
                console.log(packet);
            }else{
                this.getLogger().debug("Got Datagram for " + tsession + ", a non existing session.");
            }
        }
    }

    tick(){
        for(let [,session] of this.sessions){
            console.log(session)
        }
    }
}

module.exports =  SessionManager;