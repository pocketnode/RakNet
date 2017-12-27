const Packet = require("./Packet");

const BinaryStream = require("../BinaryStream");

class AcknowledgementPacket extends Packet {
    constructor(stream){
        super(stream);
        this.packets = [];
    }

    encodePayload(){
        let payload = new BinaryStream();
        this.packets = this.packets.sort((x,y)=>{return x-y});
        let count = this.packets.length;
        let records = 0;

        if(count > 0){
            let pointer = 0;
            let start = this.packets[0];
            let last = this.packets[0];

            while(pointer+1 < count){
                let current = this.packets[pointer++];
                let diff = current - last;
                if(diff === 1){
                    last = current;
                }else if(diff > 1){
                    if(start === last){
                        payload
                            .writeBool(true)
                            .writeLTriad(start);
                        start = last = current;
                    }else{
                        payload
                            .writeBool(false)
                            .writeLTriad(start)
                            .writeLTriad(last);
                        start = last = current;
                    }
                    records++;
                }
            }

            if(start === last){
                payload
                    .writeBool(true)
                    .writeLTriad(start);
            }else{
                payload
                    .writeBool(false)
                    .writeLTriad(start)
                    .writeLTriad(last);
            }
            records++;
        }

        this.getStream()
            .writeShort(records)
            .append(payload.getBuffer());
    }

    decodePayload(){
        let count = this.getStream().readShort();
        this.packets = [];
        let cnt = 0;
        for(let i = 0; i < count && !this.getStream().feof() && cnt < 4096; ++i){
            if(this.getStream().readByte() === 0){
                let start = this.getStream().readLTriad();
                let end = this.getStream().readLTriad();
                if((end - start) > 512){
                    end = start + 512;
                }
                for(let c = start; c <= end; ++c){
                    this.packets[cnt++] = c;
                }
            }else{
                this.packets[cnt++] = this.getStream().readLTriad();
            }
        }
    }
}

module.exports = AcknowledgementPacket;