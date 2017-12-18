const BinaryStream = require("../BinaryStream");

const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class UnconnectedPing extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_UNCONNECTED_PING;
    }

    initVars(){
        this.pingId = -1;
    }

    constructor(stream){
        super();
        this.initVars();

        this.stream = stream;
        this.getStream().increaseOffset(1);
    }

    decode(){
        this.pingId = this.getStream().readLong();
    }
}

module.exports = UnconnectedPing;