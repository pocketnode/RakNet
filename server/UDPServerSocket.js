const ByteBuffer = require("bytebuffer");
const dgram = require("dgram");
const RakNet = require("../RakNet.js");

Object.prototype.invert = () => {
    let object = this.valueOf();
    let new_object = {};
    for(let key in object){
        new_object[object[key]] = key;
    }
    return new_object;
};

const UnconnectedPing = require("../protocol/UnconnectedPing.js");
const UnconnectedPong = require("../protocol/UnconnectedPong.js");
//const OpenConnectionReply1 = require("../protocol/OpenConnectionReply1");
//const OpenConnectionReply2 = require("../protocol/OpenConnectionReply2");
//const OpenConnectionRequest1 = require("../protocol/OpenConnectionRequest1");
//const OpenConnectionRequest2 = require("../protocol/OpenConnectionRequest2");

class UDPServerSocket {
    constructor(server, port, logger){
        this.server = dgram.createSocket("udp4");
        this.server.raknet = RakNet;
        this.server.raknet_names = RakNet.invert();
        this.server.PocketNodeServer = server;
        this.server.logger = logger;
        this.setListeners();
        this.server.bind(port);
    }

    setListeners(){
        this.server.on("error", this.onerror);
        this.server.on("message", this.onmessage);
        this.server.on("listening", this.onlistening);
    }

    onlistening(){
        this.logger.info("Raknet Server Started!");
    }

    onerror(err){
        this.logger.error("UDPSocketServer Error: " + err);
        this.close();
    }

    onmessage(msg, rinfo) {
        var buffer = new ByteBuffer().append(msg, "hex");
        var id = buffer.buffer[0];
        if(id >= RakNet.UNCONNECTED_PING && id <= RakNet.ADVERTISE_SYSTEM){
            this.logger.debug("Got "+this.raknet_names[id]+" Packet. Hex: "+msg);
            switch(id){
                case RakNet.UNCONNECTED_PING:
                    let request = new UnconnectedPing(buffer);
                    request.decode();
                    let response = new UnconnectedPong(request.pingId, {
                        name: this.PocketNodeServer.getMotd(),
                        protocol: 130,
                        version: this.PocketNodeServer.getVersion(),
                        players: {
                            online: this.PocketNodeServer.getOnlinePlayerCount(),
                            max: this.PocketNodeServer.getMaxPlayers()
                        },
                        serverId: this.PocketNodeServer.getServerId()
                    });
                    response.encode();
                    this.send(response.bb.buffer, 0, response.bb.buffer.length, rinfo.port, rinfo.address); //Send waiting data buffer
                    break;

                default:
                    this.logger.notice("Unknown RakNet packet. Id: "+id);
                    break;
            }
        }else{
            this.logger.notice("Received unknown packet: " + id);
        }
    }
}

module.exports = UDPServerSocket;
