const UDPServerSocket = require("./UDPServerSocket");

class RakNetServer {
    constructor(Server){
        new UDPServerSocket(Server, Server.getPort(), Server.getLogger());
    }
}

module.exports = RakNetServer;