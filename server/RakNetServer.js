const UDPServerSocket = require("./UDPServerSocket");
const SessionManager = require("./SessionManager");

class RakNetServer {
    constructor(Server, Logger){
        this.server = new UDPServerSocket(Server, Server.getPort(), Logger);
        new SessionManager(this.server);
    }
}

module.exports = RakNetServer;