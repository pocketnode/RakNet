const Packet = require("./Packet");

const BITFLAG = {
    VALID: 0x80,
    ACK: 0x40,
    NAK: 0x20,
    PACKET_PAIR: 0x10,
    CONTINUOUS_SEND: 0x08,
    NEEDS_B_AND_AS: 0x04,
};

class Datagram extends Packet {
    initVars(){
        this.headerFlags = 0;

        this.packets = [];

        this.packetPair = false;
        this.continousSend = false;
        this.needsBAndsAs = false;
    }

    constructor(){
        super();


    }

    encodeHeader(){
        this.buffer.writeByte(BITFLAG.VALID | this.headerFlags);
    }

    encode(){
        
    }
}

module.exports = Datagram;