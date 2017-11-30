const SessionState = {
    CONNECTING: 0,
    CONNECTED: 1,
    DISCONNECTING: 2,
    DISCONNECTED: 3
};

class Session {
    initVars(){
        this.address = "";
        this.port = -1;
        this.clientId = -1;

        this.state = SessionState.CONNECTING;

        this.mtuSize = -1;

        this.currentSequenceNumber = 0;
        this.packets = [];
        this.sentPackets = [];
    }

    constructor(address, port, clientId, mtuSize){
        this.initVars();
        this.address = address;
        this.port = port;
        this.clientId = clientId;
        this.mtuSize = mtuSize;
    }

    open(){
        this.opened = true;
    }

    close(){
        this.opened = false;
        this.setConnected(false);
    }

    getAddress(){
        return this.address;
    }

    getPort(){
        return this.port;
    }

    getClientId(){
        return this.clientId;
    }

    setClientId(id){
        this.clientId = id;
    }

    setConnected(tf){
        this.connected = !!tf;
    }

    isConnected(){
        return this.connected;
    }

    isStackEmpty(){
        return this.packets.length === 0;
    }
}

module.exports = Session;