const Packet = require("./Packet");
const EncapsulatedPacket = require("./EncapsulatedPacket");

const ByteBuffer = require("../ByteBuffer");

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
        this.flags = 0;

        this.packets = [];

        this.sequenceNumber = 0;
    }

    constructor(buffer){
        super();
        this.initVars();

        this.buffer = buffer;
    }

    length(){
        let length = 4;
        this.packets.forEach(packet => {
            length += (packet instanceof EncapsulatedPacket ? packet.getTotalLength() : packet.length);
        });
        return length;
    }

    encode(){
        this.getByteBuffer().writeByte(BITFLAG.VALID | this.headerFlags);
        this.getBuffer().writeLTriad(this.sequenceNumber);
        this.packets.forEach(packet => {
            this.getByteBuffer().append(packet instanceof EncapsulatedPacket ? packet.toBinary() : packet.toString(), "binary");
        });
    }

    decode(){
        this.flags = this.getByteBuffer().readByte();
        this.sequenceNumber = this.getByteBuffer().readLTriad();

        while(!this.feof()){
            let buffer = new ByteBuffer().append(this.getBuffer().toString().substr(this.getBuffer().offset), "hex");

            let packet = EncapsulatedPacket.fromBinary(buffer, this.getBuffer().offset);

            if(packet.getBuffer() === "") break;

            this.packets.push(packet);
        }
    }
}

module.exports = Datagram;