const BinaryStream = require("../BinaryStream");

class Packet {
    static getId(){
        return -1;
    }

    getId(){
        return this.constructor.getId();
    }

    constructor(){
        this.stream = new BinaryStream(128);
    }

    decode(){}
    encode(){}

    getStream(){
        return this.stream;
    }

    getBuffer(){
        return this.getStream().getBuffer();
    }
}

module.exports = Packet;