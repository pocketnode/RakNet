const UnconnectedPing = require("../protocol/UnconnectedPing");
const OpenConnectionRequest1 = require("../protocol/OpenConnectionRequest1");
const OpenConnectionRequest2 = require("../protocol/OpenConnectionRequest2");

const Datagram = require("../protocol/Datagram");

class PacketPool {
    constructor(){
        this.packetPool = new Map();
        this.registerPackets();
    }

    registerPacket(id, classConstructor){
        this.packetPool.set(id, classConstructor);
    }

    getPacket(id){
        return this.packetPool.has(id) ? this.packetPool.get(id)
            : Datagram;
    }

    registerPackets(){
        this.registerPacket(UnconnectedPing.getId(), UnconnectedPing);
        this.registerPacket(OpenConnectionRequest1.getId(), OpenConnectionRequest1);
        this.registerPacket(OpenConnectionRequest2.getId(), OpenConnectionRequest2);
    }
}

module.exports = PacketPool;