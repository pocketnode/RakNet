const ByteBuffer = require("../ByteBuffer");

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
        this.buffer = new ByteBuffer();
    }

    constructor(){
        this.initVars();
    }

    static fromBinary(buffer, offset){
        let packet = new EncapsulatedPacket();

        let flags = buffer.readByte();
        packet.reliability = (flags & EPFlags.RELIABILITY_FLAGS) >> EPFlags.RELIABILITY_SHIFT;
        packet.hasSplit = (flags & EPFlags.SPLIT_FLAG) > 0;

        if(buffer.feof()){
            return packet;
        }

        packet.length = buffer.readUint16() / 8;

        if(packet.length === 0){
            return packet;
        }

        if(packet.isReliable()){
            packet.messageIndex = buffer.readLTriad();
        }

        if(packet.isSequenced()){
            packet.orderIndex = buffer.readLTriad();
            packet.orderChannel = buffer.readByte();
        }

        if(packet.hasSplit){
            packet.splitCount = buffer.readInt32();
            packet.splitId = buffer.readInt16(); //readShort
            packet.splitIndex = buffer.readInt32();
        }

        packet.buffer = new ByteBuffer().append(buffer.buffer.toString().substr(offset, packet.length));


        return packet;
    }

    toBinary(){
        let buffer = this.getBuffer().toString();
        let binary = new ByteBuffer();

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
            binary.writeInt32(this.splitCount);
            binary.writeInt16(this.splitId);
            binary.writeInt32(this.splitIndex);
        }

        binary.append(buffer);

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

    getByteBuffer(){
        return this.buffer;
    }

    getBuffer(){
        return this.getByteBuffer().buffer;
    }
}

module.exports = EncapsulatedPacket;