const ByteBuffer = require("bytebuffer");

const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class OpenConnectionReply1 extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_OPEN_CONNECTION_REPLY_1;
    }

    constructor(mtuSize, options){
        super();

        this.mtuSize = mtuSize;
        this.serverId = options.serverId;
        this.serverSecurity = options.serverSecurity || false;

        this.buffer = new ByteBuffer();
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