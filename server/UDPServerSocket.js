const ByteBuffer = require("bytebuffer");
const dgram = require("dgram");

const TempSession = require("./TempSession");
const SessionManager = require("./SessionManager");

class UDPServerSocket {
    initVars(){
        this.socket = {};
        this.packetPool = {};
        this.logger = {};
        this.sessionManager = {};
    }

    constructor(raknet, port, logger){
        this.packetPool = raknet.getPacketPool();
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
    }

    setListeners(){
        this.socket.on("error", err => {
            this.logger.error("UDPSocketServer Error:", err);
            this.close();
        });

        this.socket.on("message", (msg, rinfo) => {
            let buffer = new ByteBuffer().append(msg, "hex");
            let tsession = new TempSession(rinfo.address, rinfo.port);

            let packetId = buffer.buffer[0];

            this.logger.debug("Received Id: " + packetId);

            let packet = this.packetPool.getPacket(packetId);

            this.sessionManager.handle(new packet(buffer), tsession);
        });
    }
}

module.exports = UDPServerSocket;
