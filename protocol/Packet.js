const RakNet = require("../RakNet");
const ByteBuffer = require("../ByteBuffer");

class Packet {
    static getId(){
        return -1;
    }
    getId(){
        return this.constructor.getId();
    }

    constructor(){
        this.raknet = RakNet;
        this.buffer = new ByteBuffer();
    }

    decode(){}
    encode(){}

    getByteBuffer(){
        return this.buffer;
    }

    getBuffer(){
        return this.buffer.buffer;
    }

    getRakNet(){
        return this.raknet;
    }

    feof(){
        return typeof this.getBuffer()[this.getBuffer().offset] === "undefined";
    }

    readAddress(){
        let addr, port;
        let version = this.getByteBuffer().readByte();
        switch(version){
            default:
            case 4:
                addr = ((this.getByteBuffer().readByte()) & 0xff) + "." + ((this.getByteBuffer().readByte()) & 0xff) + "." + ((this.getByteBuffer().readByte()) & 0xff) + "." + ((this.getByteBuffer().readByte()) & 0xff);
                port = this.getByteBuffer().readShort();
                break;
            // add ipv6 support
        }
        return {ip: addr, port: port};
    }

    writeAddress(addr, port, version){
        version = version || 4;
        this.getByteBuffer().writeByte(version);
        switch(version){
            default:
            case 4:
                addr.split(".").forEach(b => {
                    this.getByteBuffer().writeByte((parseInt(b)) & 0xff);
                });
                this.getByteBuffer().writeUint16(port);
                break;
        }
    }
}

module.exports = Packet;