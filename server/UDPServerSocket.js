const BinaryStream = require("../BinaryStream");
const dgram = require("dgram");

const SessionManager = require("./SessionManager");

class UDPServerSocket {
    initVars(){
        this.socket = {};
        this.packetPool = {};
        this.logger = {};
        this.sessionManager = {};
    }

    constructor(raknet, port, logger){
        this.logger = logger;
        this.sessionManager = new SessionManager(raknet, this);

        this.socket = dgram.createSocket("udp4");
        this.setListeners();
        this.socket.bind(port);
    }
    
    getSocket(){
        return this.socket;
    }

    close(){
        this.socket.close();
        this.sessionManager.shutdown();
    }

    setListeners(){
        this.socket.on("error", err => {
            this.logger.error(err);
            this.close();
        });

        this.socket.on("message", (msg, rinfo) => {
            this.sessionManager.bytes.received += msg.length;

            let stream = new BinaryStream(msg);

            let packetId = stream.getBuffer()[0];

            //this.logger.debug("Received", packetId, "with length of", msg.length, "from", rinfo.address + ":" + rinfo.port);

            this.sessionManager.handle(packetId, stream, rinfo.address, rinfo.port);
        });
    }
}

module.exports = UDPServerSocket;
