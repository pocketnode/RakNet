const BinaryStream = require("../BinaryStream");

class Packet {
    static getId(){
        return -1;
    }

    getId(){
        return this.constructor.getId();
    }

    constructor(stream){
        if(stream instanceof BinaryStream){
            this.stream = stream;
        }else{
            this.stream = new BinaryStream();
        }
    }

    encode(){
        this.encodeHeader();
        this.encodePayload();
    }

    encodeHeader(){
        this.getStream().writeByte(this.getId());
    }

    encodePayload(){}


    decode(){
        this.decodeHeader();
        this.decodePayload();
    }

    decodeHeader(){
        this.getStream().readByte();
    }

    decodePayload(){}


    getStream(){
        return this.stream;
    }

    getBuffer(){
        return this.stream.buffer;
    }
}

module.exports = Packet;