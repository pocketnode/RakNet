const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class OpenConnectionReply2 extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_OPEN_CONNECTION_REPLY_2;
    }

    initVars(){
        this.serverId = -1;
        this.clientAddress = "";
        this.clientPort = -1;
        this.mtuSize = -1;
        this.serverSecurity = false;
    }

    constructor(){
        super();
        this.initVars();
    }

    encodePayload(){
        this.writeMagic();
        this.getStream()
            .writeLong(this.serverId)
            .writeAddress(this.clientAddress, this.clientPort, 4)
            .writeShort(this.mtuSize)
            .writeBool(this.serverSecurity);
    }
}

module.exports = OpenConnectionReply2;