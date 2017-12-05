const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class UnconnectedPing extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_UNCONNECTED_PING;
    }

    initVars(){
        this.pingId = -1;
    }

    constructor(buffer){
        super();
        this.initVars();

        this.buffer = buffer;
        this.getByteBuffer().offset = 1;
    }

    decode(){
        this.pingId = this.getByteBuffer().readLong();
        this.getByteBuffer().flip();
    }
}

module.exports = UnconnectedPing;