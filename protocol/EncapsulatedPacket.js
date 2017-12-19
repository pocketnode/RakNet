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

const Flags = {
    RELIABILITY_SHIFT: 5,
    RELIABILITY_FLAGS: 0x07 << this.RELIABILITY_SHIFT,
    SPLIT_FLAG: 0x10
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

    static fromBinary(stream){
        let packet = new EncapsulatedPacket();

        let flags = stream.readByte();
        packet.reliability = ((flags & Flags.RELIABILITY_FLAGS) >> Flags.RELIABILITY_SHIFT);
        packet.hasSplit = (flags & Flags.SPLIT_FLAG) !== 0;

        if(stream.feof()){
            console.log("ran out of bytes to read. couldn't get length.");
            return {packet:packet,offset:stream.offset};
        }

        //console.log(JSON.stringify({buffer: stream.buffer.toString("hex"), buffer_length: stream.buffer.length, offset: stream.offset}, false, 4));

        packet.length = Math.ceil(stream.readShort() / 8);

        //console.log(JSON.stringify({length: packet.length}));

        if(packet.length === 0){
            return {packet:packet,offset:stream.offset};
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
            packet.splitId = stream.readShort();
            packet.splitIndex = stream.readInt();
        }

        packet.stream = new BinaryStream(stream.buffer.slice(stream.offset, packet.length));

        return {packet:packet,offset:stream.offset};
    }

    toBinary(){
        let buffer = this.getBuffer();
        let stream = new BinaryStream();

        let split = this.hasSplit ? Flags.SPLIT_FLAG : 0;

        stream.writeByte((this.reliability << 5) | split);

        stream.writeShort(buffer.length << 3);

        if(this.isReliable()){
            stream.writeLTriad(this.messageIndex);
        }

        if(this.isSequenced()){
            stream.writeLTriad(this.orderIndex);
            stream.writeByte(this.orderChannel);
        }

        if(this.hasSplit){
            stream.writeInt(this.splitCount);
            stream.writeShort(this.splitId);
            stream.writeInt(this.splitIndex);
        }

        stream.writeString(buffer);

        return stream.buffer.toString();
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