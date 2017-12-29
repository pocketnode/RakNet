const Path = require("path");

global.raknet = function(path){
    return require(Path.normalize(__dirname + "/../" + path));
};

const UDPServerSocket = require("./UDPServerSocket");
const PacketPool = require("./PacketPool");
const ServerName = require("./ServerName");

class RakNetServer {
    initVars(){
        this.port = -1;
        this.logger = {};
        this.serverId = -1;
        this.server = {};
        this.serverName = new ServerName();
        this.packetPool = new PacketPool();
    }

    constructor(port, logger){
        this.initVars();

        if(port < 1 || port > 65536){
            throw new Error("Invalid port range");
        }

        this.port = port;
        this.logger = logger;

        this.server = new UDPServerSocket(this, port, logger);
    }

    shutdown(){
        this.server.close();
    }

    getServerName(){
        return this.serverName;
    }

    getPort(){
        return this.port;
    }

    getLogger(){
        return this.logger;
    }

    getId(){
        return this.getServerName().getServerId();
    }

    getSessionManager(){
        return this.server.sessionManager;
    }

    getPacketPool(){
        return this.packetPool;
    }
}

module.exports = RakNetServer;