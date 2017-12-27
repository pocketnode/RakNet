const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class OpenConnectionRequest2 extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_OPEN_CONNECTION_REQUEST_2;
    }

    initVars(){
        this.serverAddress = "";
        this.serverPort = -1;
        this.mtuSize = -1;
        this.clientId = -1;
    }

    constructor(stream){
        super(stream);
        this.initVars();
    }

    decodePayload(){
        this.readMagic();
        let addr = this.getStream().readAddress();
        this.serverAddress = addr.ip;
        this.serverPort = addr.port;
        this.mtuSize = this.getStream().readShort();
        this.clientId = this.getStream().readLong();
    }
}

module.exports = OpenConnectionRequest2;