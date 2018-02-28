const UnconnectedPing = require("../protocol/UnconnectedPing");
const OpenConnectionRequest1 = require("../protocol/OpenConnectionRequest1");
const OpenConnectionRequest2 = require("../protocol/OpenConnectionRequest2");

class PacketPool extends Map {
    constructor(){
        super();
        this.registerPackets();
    }

    registerPacket(packet){
        this.set(packet.getId(), packet);
    }

    getPacket(id){
        return this.has(id) ? this.get(id) : null;
    }

    registerPackets(){
        this.registerPacket(UnconnectedPing);
        this.registerPacket(OpenConnectionRequest1);
        this.registerPacket(OpenConnectionRequest2);
    }
}

module.exports = PacketPool;