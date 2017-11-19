class Session {
    initVars(){
        this.clientId = -1;
        this.address = "";
        this.port = -1;
        this.opened = false;
        this.connected = false;
        this.currentSequenceNumber = 0;
        this.mtuSize = -1;
        this.packets = [];
        this.sentPackets = [];
    }

    constructor(address, port){
        this.initVars();
        this.address = address;
        this.port = port;
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

    isOpened(){
        return this.opened;
    }

    setConnected(tf){
        this.connected = (tf ? true : false);
    }

    isConnected(){
        return this.connected;
    }

    isStackEmpty(){
        return this.packets.length === 0;
    }


}

module.exports = Session;