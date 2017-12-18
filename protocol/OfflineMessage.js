const Packet = require("./Packet");
const RakNet = require("../RakNet");

class OfflineMessage extends Packet {
    constructor(){
        super();
        this.magic = "";
    }

    //todo
    hasMagic(){
        return Buffer.from(RakNet.MAGIC, "binary").equals();
    }

    readMagic(){
        this.magic = this.getBuffer().slice(0, 16).toString("binary");
        this.getStream().increaseOffset(16);
    }

    writeMagic(){
        this.getBuffer().write(RakNet.MAGIC, this.getStream().offset, 16, "binary");
        this.getStream().increaseOffset(16);
    }

    verifyMagic(){
        return Buffer.from(RakNet.MAGIC, "binary").equals(Buffer.from(this.magic, "binary"));
    }
}

module.exports = OfflineMessage;