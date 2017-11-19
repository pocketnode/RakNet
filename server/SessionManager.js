const Session = require("./Session");

class SessionManager {
    initVars(){
        this.UDPSocketServer = null;
        this.sessions = new Map();
    }

    constructor(server){
        this.initVars();

        this.UDPSocketServer = server;
    }

    createSession(address, port){
        let session = new Session(address, port);
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