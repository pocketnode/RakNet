const Path = require("path");

global.raknet = function(path){
    return require(Path.normalize(__dirname + "/../" + path));
};

const UDPServerSocket = require("./UDPServerSocket");
const SessionManager = require("./SessionManager");
const PacketPool = require("./PacketPool");
const ServerName = require("./ServerName");

class RakNetServer {
    initVars(){
        this._port = -1;
        this._logger = null;

        this._shutdown = false;

        this._server = null;
        this._sessionManager = null;

        this._serverName = new ServerName();
        this._packetPool = new PacketPool();
    }

    constructor(port, logger){
        this.initVars();

        if(port < 1 || port > 65536){
            throw new Error("Invalid port range");
        }

        this._port = port;
        this._logger = logger;

        this._server = new UDPServerSocket(port, logger);
        this._sessionManager = new SessionManager(this, this._server);
    }

    isShutdown(){
        return this._shutdown === true;
    }

    shutdown(){
        this._shutdown = true;
    }

    getPort(){
        return this._port;
    }

    getServerName(){
        return this._serverName;
    }

    getLogger(){
        return this._logger;
    }

    getId(){
        return this.getServerName().getServerId();
    }

    getSessionManager(){
        return this._sessionManager;
    }

    getPacketPool(){
        return this._packetPool;
    }
}

module.exports = RakNetServer;