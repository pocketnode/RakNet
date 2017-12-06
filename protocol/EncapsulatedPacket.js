class EncapsulatedPacket {
    constructor(){}

    static fromBinary(buffer, offset){
        let packet = new EncapsulatedPacket();

        let flags = buffer.readByte();

    }

    getByteBuffer(){
        return this.buffer;
    }

    getBuffer(){
        return this.getByteBuffer().buffer;
    }
}

module.exports = EncapsulatedPacket;