const Packet = require("./Packet");
const RakNet = require("../RakNet");

class OfflineMessage extends Packet {
    constructor(){
        super();
        this.magic = "";
    }

    readMagic(){
        this.magic = this.getBuffer().slice(this.getStream().increaseOffset(16), this.getStream().offset);
    }

    writeMagic(){
        this.getBuffer().write(RakNet.MAGIC, this.getStream().increaseOffset(16), 16, "binary");
    }

    validMagic(){
        return this.magic.equals(Buffer.from(RakNet.MAGIC, "binary"));
    }
}

module.exports = OfflineMessage;