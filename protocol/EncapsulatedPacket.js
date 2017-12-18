const BinaryStream = require("../BinaryStream");

const PacketReliability = {
    /*
     * From https://github.com/OculusVR/RakNet/blob/master/Source/PacketPriority.h
     *
     * Default: 0b010 (2) or 0b011 (3)
     */

    UNRELIABLE: 0,
    UNRELIABLE_SEQUENCED: 1,
    RELIABLE: 2,
    RELIABLE_ORDERED: 3,
    RELIABLE_SEQUENCED: 4,
    UNRELIABLE_WITH_ACK_RECEIPT: 5,
    RELIABLE_WITH_ACK_RECEIPT: 6,
    RELIABLE_ORDERED_WITH_ACK_RECEIPT: 7
};

const EPFlags = {
    RELIABILITY_SHIFT: 5,
    RELIABILITY_FLAGS: 0b111 << this.RELIABILITY_SHIFT,
    SPLIT_FLAG: 0b00010000
};

class EncapsulatedPacket {
    initVars(){
        this.reliability = 0;
        this.hasSplit = false;
        this.length = 0;
        this.messageIndex = null;
        this.orderIndex = null;
        this.orderChannel = null;
        this.splitCount = null;
        this.splitId = null;
        this.splitIndex = null;
        this.stream = new BinaryStream();
    }

    constructor(){
        this.initVars();
    }

    static fromBinary(stream, offset){
        let packet = new EncapsulatedPacket();

        let flags = stream.readByte();
        packet.reliability = (flags & EPFlags.RELIABILITY_FLAGS) >> EPFlags.RELIABILITY_SHIFT;
        packet.hasSplit = (flags & EPFlags.SPLIT_FLAG) > 0;

        if(stream.feof()){
            return packet;
        }

        packet.length = stream.readShort() / 8;

        if(packet.length === 0){
            return packet;
        }

        if(packet.isReliable()){
            packet.messageIndex = stream.readLTriad();
        }

        if(packet.isSequenced()){
            packet.orderIndex = stream.readLTriad();
            packet.orderChannel = stream.readByte();
        }

        if(packet.hasSplit){
            packet.splitCount = stream.readInt();
            packet.splitId = stream.readShort(true); //readShort
            packet.splitIndex = stream.readInt();
        }

        packet.stream = new BinaryStream(Buffer.from(stream.buffer.toString().substr(offset, packet.length)));


        return packet;
    }

    toBinary(){
        let buffer = this.getBuffer().toString();
        let binary = new BinaryStream();

        let split = this.hasSplit ? EPFlags.SPLIT_FLAG : 0;

        binary.writeByte((this.reliability << 5) | split);

        binary.writeShort(buffer.length << 3);

        if(this.isReliable()){
            binary.writeLTriad(this.messageIndex);
        }

        if(this.isSequenced()){
            binary.writeLTriad(this.orderIndex);
            binary.writeByte(this.orderChannel);
        }

        if(this.hasSplit){
            binary.writeInt(this.splitCount);
            binary.writeShort(this.splitId);
            binary.writeInt(this.splitIndex);
        }

        binary.writeString(buffer);

        return binary.buffer.toString();
    }

    isReliable(){
        switch(this.reliability){
            case PacketReliability.RELIABLE:
            case PacketReliability.RELIABLE_ORDERED:
            case PacketReliability.RELIABLE_SEQUENCED:
            case PacketReliability.RELIABLE_WITH_ACK_RECEIPT:
            case PacketReliability.RELIABLE_ORDERED_WITH_ACK_RECEIPT:
                return true;
            default:
                return false;
        }
    }

    isSequenced(){
        switch(this.reliability){
            case PacketReliability.UNRELIABLE_SEQUENCED:
            case PacketReliability.RELIABLE_ORDERED:
            case PacketReliability.RELIABLE_SEQUENCED:
            case PacketReliability.RELIABLE_ORDERED_WITH_ACK_RECEIPT:
                return true;
            default:
                return false;
        }
    }

    getStream(){
        return this.stream;
    }

    getBuffer(){
        return this.getStream().buffer;
    }
}

module.exports = EncapsulatedPacket;