const ByteBufferOriginal = require("bytebuffer");
let substr = require('locutus/php/strings/substr');

class ByteBuffer extends ByteBufferOriginal {
    constructor(){
        super();
    }

    readLTriad(offset){
        return this.unpack("V", offset + "\x00");
    }

    writeLTriad(value){
        return substr(this.pack("N", value), 1);
    }

    feof(){
        return typeof this.getBuffer()[this.offset] === "undefined";
    }

    getBuffer(){
        return this.buffer;
    }

    pack(bytes) {
        var chars = [];
        for(var i = 0, n = bytes.length; i < n;) {
            chars.push(((bytes[i++] & 0xff) << 8) | (bytes[i++] & 0xff));
        }
        return String.fromCharCode.apply(null, chars);
    }

   unpack(str) {
        var bytes = [];
        for(var i = 0, n = str.length; i < n; i++) {
            var char = str.charCodeAt(i);
            bytes.push(char >>> 8, char & 0xFF);
        }
        return bytes;
    }

}

module.exports = ByteBuffer;
