class TempSession {
    constructor(address, port){
        this.address = address;
        this.port = port;
    }

    getAddress(){
        return this.address;
    }

    getPort(){
        return this.port;
    }

    toString(){
        return this.address + ":" + this.port;
    }
}

module.exports = TempSession;