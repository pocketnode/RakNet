const ByteBuffer = require("bytebuffer");

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

        this.buffer = new ByteBuffer();
        this.getByteBuffer().buffer[0] = MessageIdentifiers.ID_OPEN_CONNECTION_REPLY_2;
        this.getByteBuffer().offset = 1;
    }

    encode(){
        this.writeMagic();
        this.getByteBuffer()
            .writeLong(this.serverId);
        this.writeAddress(this.clientAddress, this.clientPort, 4);
        this.getByteBuffer()
            .writeShort(this.mtuSize)
            .writeByte(this.serverSecurity ? 1 : 0)
            .flip()
            .compact();
    }
}

module.exports = OpenConnectionReply2;