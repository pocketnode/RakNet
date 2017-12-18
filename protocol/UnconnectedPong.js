const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class UnconnectedPong extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_UNCONNECTED_PONG;
    }

    initVars() {
        this.serverName = {};
        this.serverId = -1;
        this.pingId = -1;
    }


    constructor(){
        super();
        this.initVars();

        this.getStream().writeByte(MessageIdentifiers.ID_UNCONNECTED_PONG);
    }
    
    encode(){
        let name = [
            "MCPE",
            this.serverName.name,
            this.serverName.protocol,
            this.serverName.version,
            this.serverName.players.online,
            this.serverName.players.max,
            this.serverName.serverId,
            this.serverName.motd,
            this.serverName.gamemode
        ].join(";");

        this.getStream()
            .writeLong(this.pingId)
            .writeLong(this.serverId);

        this.writeMagic();

        this.getStream()
            .writeShort(name.length)
            .writeString(name);
    }
}

module.exports = UnconnectedPong;