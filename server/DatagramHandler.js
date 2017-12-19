const Datagram = require("../protocol/Datagram");
const BITFLAG = require("../protocol/BitFlags");

class DatagramHandler {
    constructor(manager){
        this.sessionManager = manager;
    }

    handle(packet, session){
        if(!(packet instanceof Datagram)) throw new Error("Expected Datagram, got " + (packet.name ? packet.name : packet));

        let packetId = packet.getBuffer()[0];

        if((packetId & BITFLAG.VALID) === 0){
            this.sessionManager.getLogger().debug("Ignored non-connected message for " + session + " due to session already opened");
            return;
        }
        this.sessionManager.getLogger().debug("Got Datagram for "+session);
    }
}

module.exports = DatagramHandler;