const Packet = require("./Packet");
const MessageIdentifiers = require("./MessageIdentifiers");

class NewIncomingConnection extends Packet {
    static getId(){
        return MessageIdentifiers.ID_NEW_INCOMING_CONNECTION;
    }

    initVars(){
        this.address = "";
        this.port = -1;

        this.systemAddresses = [];

        this.sendPingTime = -1;
        this.sendPongTime = -1;
    }

    constructor(stream){
        super(stream);
        this.initVars();
    }

    encodePayload(){}

    decodePayload(){
        let addr = this.getStream().readAddress();
        this.address = addr.ip;
        this.port = addr.port;

        let stopOffset = this.getBuffer().length - 16;
        for(let i = 0; i < 20; ++i){
            if(this.getStream().offset >= stopOffset){
                this.systemAddresses.push(["0.0.0.0", 0, 4]);
            }else{
                let addr = this.getStream().readAddress();
                this.systemAddresses.push([addr.ip, addr.port, addr.version]);
            }
        }

        this.sendPingTime = this.getStream().readLong();
        this.sendPongTime = this.getStream().readLong();
    }
}

module.exports = NewIncomingConnection;