const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class OpenConnectionRequest1 extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_OPEN_CONNECTION_REQUEST_1;
    }

    initVars(){
        this.protocol = -1;
        this.mtuSize = -1;
    }

    constructor(buffer){
        super();
        this.initVars();

        this.buffer = buffer;
    }

    decode(){
        this.readMagic();
        this.protocol = this.getByteBuffer().readByte();
        this.mtuSize  = (this.getBuffer().slice(this.getByteBuffer().offset)).length + 18;
        this.getByteBuffer().flip();
    }
}

module.exports = OpenConnectionRequest1;