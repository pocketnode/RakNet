const ByteBuffer = require("bytebuffer");

const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class OpenConnectionReply1 extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_OPEN_CONNECTION_REPLY_1;
    }

    initVars(){
        this.serverId = -1;
        this.serverSecurity = false;
        this.mtuSize = -1;
    }

    constructor(){
        super();
        this.initVars();

        this.getByteBuffer().buffer[0] = MessageIdentifiers.ID_OPEN_CONNECTION_REPLY_1;
        this.getByteBuffer().offset = 1;
    }

    encode(){
        this.writeMagic();
        this.getByteBuffer()
            .writeLong(this.serverId)
            .writeByte(this.serverSecurity ? 1 : 0)
            .writeShort(this.mtuSize)
            .flip()
            .compact();
    }
}

module.exports = OpenConnectionReply1;