const Packet = require("./Packet");

class OfflineMessage extends Packet {
    constructor(){
        super();
        this.magic = "";
    }

    readMagic(){
        this.magic = this.getBuffer().slice(0, 16).toString("binary");
        this.getByteBuffer().flip();
        this.getByteBuffer().offset += 16;
    }

    writeMagic(){
        this.getByteBuffer().append(this.getRakNet().MAGIC, "binary");
    }

    validateMagic(){
        return Buffer.from(this.getRakNet().MAGIC, "binary").equals(Buffer.from(this.magic, "binary"));
    }
}

module.exports = OfflineMessage;