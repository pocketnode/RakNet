const BinaryStream = require("../BinaryStream");

const Packet = require("./Packet");
const EncapsulatedPacket = require("./EncapsulatedPacket");
const BITFLAG = require("./BitFlags");

class Datagram extends Packet {
    initVars(){
        this.headerFlags = 0;
        this.flags = {
            packetPair: false,
            continuousSend: false,
            needsBAndAs: false
        };

        this.packets = [];

        this.sequenceNumber = 0;
    }

    constructor(stream){
        super();
        this.initVars();

        this.stream = stream;
    }

    encodeHeader(){
        if(this.flags.packetPair === true)     this.headerFlags |= BITFLAG.PACKET_PAIR;
        if(this.flags.continuousSend === true) this.headerFlags |= BITFLAG.CONTINUOUS_SEND;
        if(this.flags.needsBAndAs === true)    this.headerFlags |= BITFLAG.NEEDS_B_AND_AS;
        this.getStream().writeByte(BITFLAG.VALID | this.headerFlags);
    }

    encodePayload(){
        this.getStream().writeLTriad(this.sequenceNumber);
        this.packets.forEach(packet => {
            this.getStream().writeString(packet.toBinary());
        });
    }

    length(){
        let length = 4;
        this.packets.forEach(packet => {
            length += (packet instanceof EncapsulatedPacket ? packet.getTotalLength() : packet.length);
        });
        return length;
    }

    decodeHeader(){
        this.headerFlags = this.getStream().readByte();
        this.flags.packetPair     = (this.headerFlags & BITFLAG.PACKET_PAIR) !== 0;
        this.flags.continuousSend = (this.headerFlags & BITFLAG.CONTINUOUS_SEND) !== 0;
        this.flags.needsBAndAs    = (this.headerFlags & BITFLAG.NEEDS_B_AND_AS) !== 0;
    }

    decodePayload(){
        this.sequenceNumber = this.getStream().readLTriad();

        while(!this.getStream().feof()){
            let stream = new BinaryStream(this.getBuffer().slice(this.getStream().offset));
            let data = EncapsulatedPacket.fromBinary(stream);
            this.getStream().offset += data.offset;
            if(data.packet.getBuffer().toString() === "") break;

            this.packets.push(data.packet);
        }

        console.log(this.packets);
    }
}

module.exports = Datagram;