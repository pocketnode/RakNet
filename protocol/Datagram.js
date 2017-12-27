const Packet = require("./Packet");
const EncapsulatedPacket = require("./EncapsulatedPacket");
const BITFLAG = require("./BitFlags");

class Datagram extends Packet {
    initVars(){
        this.headerFlags = 0;

        this.packetPair = false;
        this.continuousSend = false;
        this.needsBAndAs = false;

        this.packets = [];

        this.sequenceNumber = 0;
    }

    constructor(stream){
        super(stream);
        this.initVars();
    }

    encodeHeader(){
        if(this.packetPair === true) this.headerFlags |= BITFLAG.PACKET_PAIR;
        if(this.continuousSend === true) this.headerFlags |= BITFLAG.CONTINUOUS_SEND;
        if(this.needsBAndAs === true) this.headerFlags |= BITFLAG.NEEDS_B_AND_AS;
        this.getStream().writeByte(BITFLAG.VALID | this.headerFlags);
    }

    encodePayload(){
        this.getStream().writeLTriad(this.sequenceNumber); // all of a sudden sequence num started being a string
        this.packets.forEach(packet => this.getStream().append(packet));
    }

    getLength(){
        let length = 4;
        this.packets.forEach(packet => {
            length += (packet instanceof EncapsulatedPacket ? packet.getLength() : Buffer.byteLength(packet, "hex"));
        });
        return length;
    }

    decodeHeader(){
        this.headerFlags = this.getStream().readByte();
        this.packetPair     = (this.headerFlags & BITFLAG.PACKET_PAIR) > 0;
        this.continuousSend = (this.headerFlags & BITFLAG.CONTINUOUS_SEND) > 0;
        this.needsBAndAs    = (this.headerFlags & BITFLAG.NEEDS_B_AND_AS) > 0;
    }

    decodePayload(){
        this.sequenceNumber = this.getStream().readLTriad();

        while(!this.getStream().feof()){
            let packet = EncapsulatedPacket.fromBinary(this.stream);

            if(packet.getStream().length === 0){
                break;
            }

            this.packets.push(packet);
        }
    }
}

module.exports = Datagram;