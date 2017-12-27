const Packet = require("./Packet");
const RakNet = require("../RakNet");

class OfflineMessage extends Packet {
    constructor(stream){
        super(stream);
        this.magic = "";
    }

    readMagic(){
        this.magic = this.getBuffer().slice(this.getStream().offset, this.getStream().increaseOffset(16, true));
    }

    writeMagic(){
        this.getStream().append(Buffer.from(RakNet.MAGIC, "binary"));
    }

    validMagic(){
        return Buffer.from(this.magic).equals(Buffer.from(RakNet.MAGIC, "binary"));
    }
}

module.exports = OfflineMessage;