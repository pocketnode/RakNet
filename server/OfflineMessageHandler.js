const RakNet = require("../RakNet");

const OfflineMessage = require("../protocol/OfflineMessage");
const UnconnectedPing = require("../protocol/UnconnectedPing");
const UnconnectedPong = require("../protocol/UnconnectedPong");
const OpenConnectionRequest1 = require("../protocol/OpenConnectionRequest1");
const OpenConnectionRequest2 = require("../protocol/OpenConnectionRequest2");
const OpenConnectionReply1 = require("../protocol/OpenConnectionReply1");
const OpenConnectionReply2 = require("../protocol/OpenConnectionReply2");
const IncompatibleProtocolVersion = require("../protocol/IncompatibleProtocolVersion");

class OfflineMessageHandler {
    constructor(manager){
        this.sessionManager = manager;
    }

    handle(packet, address, port){
        if(!(packet instanceof OfflineMessage)) throw new Error("Expected OfflineMessage, got " + (packet.name ? packet.name : packet));

        let pk;
        switch(packet.getId()){
            case UnconnectedPing.getId():
                pk = new UnconnectedPong();
                pk.serverName = this.sessionManager.getServerName().toString();
                pk.serverId = this.sessionManager.getId();
                pk.pingId = packet.pingId;
                this.sessionManager.sendPacket(pk, address, port);
                return true;

            case OpenConnectionRequest1.getId():
                if(packet.protocolVersion !== RakNet.PROTOCOL){
                    pk = new IncompatibleProtocolVersion();
                    pk.protocolVersion = RakNet.PROTOCOL;
                    pk.serverId = this.sessionManager.getId();
                    this.sessionManager.getLogger().debug(address+":"+port+" couldn't connect because they had protocol " + packet.protocolVersion + ", while RakNet is running on protocol " + RakNet.PROTOCOL);
                }else{
                    pk = new OpenConnectionReply1();
                    pk.serverId = this.sessionManager.getId();
                    pk.mtuSize = packet.mtuSize;
                }
                this.sessionManager.sendPacket(pk, address, port);
                return true;

            case OpenConnectionRequest2.getId():
                if(true || packet.serverPort === this.sessionManager.getPort()){
                    let mtuSize = Math.min(Math.abs(packet.mtuSize), 1464);
                    pk = new OpenConnectionReply2();
                    pk.serverId = this.sessionManager.getId();
                    pk.clientAddress = address;
                    pk.clientPort = port;
                    pk.mtuSize = mtuSize;
                    this.sessionManager.sendPacket(pk, address, port);
                    let session = this.sessionManager.createSession(address, port, packet.clientId, mtuSize);
                    this.sessionManager.getLogger().debug("Created session for "+session);
                }else{
                    this.sessionManager.getLogger().debug("Not creating session for " + address + ":" + port + " due to mismatched port, expected " + this.sessionManager.getPort() + ", got " + packet.serverPort);
                }
                return true;
        }

        return false;
    }

}

module.exports = OfflineMessageHandler;