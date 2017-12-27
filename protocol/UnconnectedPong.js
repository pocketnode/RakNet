const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class UnconnectedPong extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_UNCONNECTED_PONG;
    }

    initVars() {
        this.serverName = "";
        this.serverId = -1;
        this.pingId = -1;
    }


    constructor(){
        super();
        this.initVars();
    }
    
    encodePayload(){
        this.getStream()
            .writeLong(this.pingId)
            .writeLong(this.serverId);

        this.writeMagic();

        this.getStream()
            .writeShort(this.serverName.length)
            .writeString(this.serverName);
    }
}

module.exports = UnconnectedPong;