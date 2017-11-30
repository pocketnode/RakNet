const Session = require("./Session");
const OfflineMessageHandler = require("./OfflineMessageHandler");

class SessionManager {
    initVars(){
        this.UDPSocketServer = null;
        this.sessions = new Map();
    }

    constructor(server){
        this.initVars();

        this.UDPSocketServer = server;
    }

    createSession(address, port, clientId, mtuSize){
        let session = new Session(address, port, clientId, mtuSize);
        this.sessions.set(address + ":" + port, session);
        return session;
    }

    sessionExists(address, port){
        return this.sessions.has(address + ":" + port);
    }

    getSession(address, port){
        if(this.sessionExists(address, port)){
            return this.sessions.get(address + ":" + port);
        }else{
            return false;
        }
    }
}

module.exports =  SessionManager;