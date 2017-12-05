const UDPServerSocket = require("./UDPServerSocket");
const PacketPool = require("./PacketPool");

class RakNetServer {
    initVars(){
        this.pocketnode = {};
        this.port = -1;
        this.logger = {};
        this.serverId = -1;
        this.server = {};
        this.packetPool = new PacketPool();
    }

    constructor(server, logger){
        this.initVars();

        if(server.getPort() < 1 || server.getPort() > 65536){
            throw new Error("Invalid port range");
        }

        this.pocketnode = server;

        this.port = this.pocketnode.getPort();
        this.logger = logger;

        this.serverId = this.pocketnode.getServerId();

        this.server = new UDPServerSocket(this, this.getPort(), this.getLogger());
    }

    getPort(){
        return this.port;
    }

    getLogger(){
        return this.logger;
    }

    getId(){
        return this.serverId;
    }

    getPacketPool(){
        return this.packetPool;
    }
}

module.exports = RakNetServer;