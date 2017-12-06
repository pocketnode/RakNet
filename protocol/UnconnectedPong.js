const ByteBuffer = require("bytebuffer");

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

        this.getByteBuffer().buffer[0] = MessageIdentifiers.ID_UNCONNECTED_PONG;
        this.getByteBuffer().offset = 1;
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

        this.getByteBuffer()
            .writeLong(this.pingId)
            .writeLong(this.serverId);

        this.writeMagic();

        this.getByteBuffer()
            .writeShort(name.length)
            .writeString(name)
            .flip()
            .compact();
    }
}

module.exports = UnconnectedPong;