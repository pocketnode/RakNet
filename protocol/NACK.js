const AcknowledgementPacket = require("./AcknowledgementPacket");

class NACK extends AcknowledgementPacket {
    static getId(){
        return 0xA0;
    }

    constructor(stream){
        super();
        if(stream) this.stream = stream;
    }
}

module.exports = NACK;