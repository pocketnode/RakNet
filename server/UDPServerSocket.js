const ByteBuffer = require("bytebuffer");
const dgram = require("dgram");
const MessageIdentifiers = require("../protocol/MessageIdentifiers");
const MessageIdentifierNames = (require("invert-kv"))(MessageIdentifiers);

const UnconnectedPing = require("../protocol/UnconnectedPing");
const UnconnectedPong = require("../protocol/UnconnectedPong");
const OpenConnectionRequest1 = require("../protocol/OpenConnectionRequest1");
const OpenConnectionRequest2 = require("../protocol/OpenConnectionRequest2");
const OpenConnectionReply1 = require("../protocol/OpenConnectionReply1");
const OpenConnectionReply2 = require("../protocol/OpenConnectionReply2");

class UDPServerSocket {
    constructor(server, port, logger){
        this.server = dgram.createSocket("udp4");
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
        this.logger.info("RakNet Server Started!");
    }

    onerror(err){
        this.logger.error("UDPSocketServer Error: " + err);
        this.close();
    }

    onmessage(msg, rinfo) {
        let buffer = new ByteBuffer().append(msg, "hex");
        let id = buffer.buffer[0];
        if(id >= MessageIdentifiers.ID_UNCONNECTED_PING && id <= MessageIdentifiers.ID_ADVERTISE_SYSTEM){
            this.logger.debug("Got "+MessageIdentifierNames[id]+" Packet. Hex: "+msg);
            let request, response;
            switch(id){
                case UnconnectedPing.getId():
                    request = new UnconnectedPing(buffer);
                    request.decode();
                    response = new UnconnectedPong(request.pingId, {
                        name: this.PocketNodeServer.getMotd(),
                        protocol: this.PocketNodeServer.getProtocol(),
                        version: this.PocketNodeServer.getVersion(),
                        players: {
                            online: this.PocketNodeServer.getOnlinePlayerCount(),
                            max: this.PocketNodeServer.getMaxPlayers()
                        },
                        serverId: this.PocketNodeServer.getServerId()
                    });
                    response.encode();
                    this.send(response.getBuffer(), 0, response.getBuffer().length, rinfo.port, rinfo.address);
                    break;

                case OpenConnectionRequest1.getId():
                    request = new OpenConnectionRequest1(buffer);
                    request.decode();

                    response = new OpenConnectionReply1(request.mtuSize, {
                        serverId: this.PocketNodeServer.getServerId(),
                        serverSecurity: this.PocketNodeServer.requiresAuthentication()
                    });
                    response.encode();
                    this.send(response.getBuffer(), 0, response.getBuffer().length, rinfo.port, rinfo.address);
                    break;

                case OpenConnectionRequest2.getId():
                    request = new OpenConnectionRequest2(buffer);
                    request.decode();

                    response = new OpenConnectionReply2(request.mtuSize, {
                        ip: rinfo.address,
                        port: rinfo.port
                    }, {
                        serverId: this.PocketNodeServer.getServerId(),
                        serverSecurity: this.PocketNodeServer.requiresAuthentication()
                    });
                    response.encode();
                    //console.log("BUFFER:", respon)
                    this.send(response.getBuffer(), 0, response.getBuffer().length, rinfo.port, rinfo.address);
                    break;

                default:
                    this.logger.notice("Received unhandled packet: " + id + "(" + MessageIdentifierNames[id] + ")");
                    break;
            }
        }else if(MessageIdentifiers[id] != null){
            this.logger.notice("Received unhandled packet: " + id + "(" + MessageIdentifierNames[id] + ")");
        }else{
            this.logger.notice("Received unknown packet. Id: " + id);
        }
    }
}

module.exports = UDPServerSocket;
