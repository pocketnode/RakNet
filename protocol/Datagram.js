const Packet = require("./Packet");
const EncapsulatedPacket = require("./EncapsulatedPacket");

const BitFlag = {
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
        this.packetPair = false;
        this.continuousSend = false;
        this.needsBAndAs = false;

        this.packets = [];

        this.sequenceNumber = 0;
    }

    constructor(stream){
        super();
        this.initVars();

        this.stream = stream;
    }

    length(){
        let length = 4;
        this.packets.forEach(packet => {
            length += (packet instanceof EncapsulatedPacket ? packet.getTotalLength() : packet.length);
        });
        return length;
    }

    encode(){
        if(this.packetPair === true) this.flags |= BitFlag.PACKET_PAIR;
        if(this.continuousSend === true) this.flags |= BitFlag.CONTINUOUS_SEND;
        if(this.needsBAndAs === true) this.flags |= BitFlag.NEEDS_B_AND_AS;

        this.getStream().writeByte(BitFlag.VALID | this.flags);
        this.getStream().writeLTriad(this.sequenceNumber);
        this.packets.forEach(packet => {
            this.getStream().writeString(packet.toBinary());
        });
    }

    decode(){
        this.flags = this.getStream().readByte();

        this.packetPair = this.flags & BitFlag.PACKET_PAIR !== 0;
        this.continuousSend = this.flags & BitFlag.CONTINUOUS_SEND !== 0;
        this.needsBAndAs = this.flags & BitFlag.NEEDS_B_AND_AS !== 0;

        this.sequenceNumber = this.getStream().readLTriad();

        while(!this.getStream().feof()){
            let packet = EncapsulatedPacket.fromBinary(this.getStream(), this.getStream().offset);
            console.log(packet);
            if(packet.getBuffer() === "") break;

            this.packets.push(packet);
        }
    }
}

module.exports = Datagram;