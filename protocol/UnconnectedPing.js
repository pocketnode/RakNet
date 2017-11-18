const Packet = require("./Packet");
const MessageIdentifiers = require("./MessageIdentifiers");

class UnconnectedPing extends Packet {
    static getId(){
        return MessageIdentifiers.ID_UNCONNECTED_PING;
    }

    constructor(buffer){
        super();

        this.pingId = -1;
        this.buffer = buffer;
        this.getByteBuffer().offset = 1;
    }

    decode(){
        this.pingId = this.getByteBuffer().readLong();
        this.getByteBuffer().flip();
    }
}

module.exports = UnconnectedPing;