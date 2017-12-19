const BinaryStream = require("../BinaryStream");
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
            this.logger.error(err);
            this.close();
        });

        this.socket.on("message", (msg, rinfo) => {
            let stream = new BinaryStream(msg);
            let tsession = new TempSession(rinfo.address, rinfo.port);

            let packetId = stream.getBuffer()[0];

            this.logger.debug("Received Id:", packetId, "Length:", msg.length);

            let packet = this.packetPool.getPacket(packetId);

            this.sessionManager.handle(new packet(stream), tsession);
        });

        this.socket.on("close", () => {
            this.logger.debug("Something closed.. lol");
        });
    }
}

module.exports = UDPServerSocket;
