const Packet = require("./Packet");
const MessageIdentifiers = require("./MessageIdentifiers");

class ConnectedPong extends Packet {
    static getId(){
        return MessageIdentifiers.ID_CONNECTED_PONG;
    }

    initVars(){
        this.sendPingTime = -1;
        this.sendPongTime = -1;
    }

    constructor(stream){
        super(stream);
        this.initVars();
    }

    encodePayload(){
        this.getStream()
            .writeLong(this.sendPingTime)
            .writeLong(this.sendPongTime);
    }

    decodePayload(){
        this.sendPingTime = this.getStream().readLong();
        this.sendPongTime = this.getStream().readLong();
    }
}

module.exports = ConnectedPong;