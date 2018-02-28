const dgram = require("dgram");

class UDPServerSocket {
    constructor(port, logger){
        this._socket = dgram.createSocket("udp4");

        this._socket.on("error", err => {
            logger.error(err);
            this.close();
        });

        this._socket.bind(port);
    }
    
    getSocket(){
        return this._socket;
    }

    sendBuffer(buffer, address, port){
        return this.getSocket().send(buffer, 0, buffer.length, port, address);
    }

    close(){
        this._socket.close();
    }
}

module.exports = UDPServerSocket;
