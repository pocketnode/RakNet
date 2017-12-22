const AcknowledgementPacket = require("./AcknowledgementPacket");

class ACK extends AcknowledgementPacket {
    static getId(){
        return 0xc0;
    }

    constructor(stream){
        super();
        if(stream)this.stream = stream;
    }
}

module.exports = ACK;