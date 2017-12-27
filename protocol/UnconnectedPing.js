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
        super(stream);
        this.initVars();
    }

    decodePayload(){
        this.pingId = this.getStream().readLong();
        this.readMagic();
    }
}

module.exports = UnconnectedPing;