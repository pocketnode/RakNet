const Packet = require("./Packet");
const MessageIdentifiers = require("./MessageIdentifiers");

class ConnectionRequestAccepted extends Packet {
    static getId(){
        return MessageIdentifiers.ID_CONNECTION_REQUEST_ACCEPTED;
    }

    initVars(){
        this.address = "";
        this.port = -1;
        this.systemAddresses = [
            ["127.0.0.1", 0, 4]
        ];
        this.sendPingTime = -1;
        this.sendPongTime = -1;
    }

    constructor(){
        super();
        this.initVars();
    }

    encodePayload(){
        this.getStream()
            .writeAddress(this.address, this.port, 4)
            .writeShort(0);

        for(let i = 0; i < 20; ++i){
            let addr = typeof this.systemAddresses[i] !== "undefined" ? this.systemAddresses[i] : ["0.0.0.0", 0, 4];
            this.getStream().writeAddress(addr[0], addr[1], addr[2]);
        }

        this.getStream()
            .writeLong(this.sendPingTime)
            .writeLong(this.sendPongTime);
    }
}

module.exports = ConnectionRequestAccepted;