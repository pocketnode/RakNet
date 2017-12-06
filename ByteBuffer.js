const ByteBufferOriginal = require("bytebuffer");

class ByteBuffer extends ByteBufferOriginal {
    constructor(){
        super();
    }

    readLTriad(offset){
        offset = offset || this.offset;
        let bytes = [this.readByte(offset-3), this.readByte(offset-2), this.readByte(offset-1)];
        this.offset -= 3;
        console.log(bytes);
        return bytes[2] | (bytes[1] << 8) | (bytes[0] << 16);
    }

    writeLTriad(value){
        this.writeByte(value >> 16)
            .writeByte(value >> 8 & 0xFF)
            .writeByte(value & 0xFF);
        return this;
    }
}

let bb = new ByteBuffer();
bb.writeLTriad(0xb3face);
bb.writeLTriad(0xb3face);
console.log(bb);
console.log(bb.readLTriad());
bb.writeLTriad(0xb3face);
console.log(bb);
console.log(typeof bb.buffer[16]);

module.exports = ByteBuffer;