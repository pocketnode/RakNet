const ByteBuffer = require("bytebuffer");

const OfflineMessage = require("./OfflineMessage");
const MessageIdentifiers = require("./MessageIdentifiers");

class UnconnectedPong extends OfflineMessage {
    static getId(){
        return MessageIdentifiers.ID_UNCONNECTED_PONG;
    }

    constructor(pingId, options){
        super();
        
        this.pingId = pingId;
        options.name           = options.name           || "PocketNode Server";
        options.protocol       = options.protocol       || 137; // 1.2.3
        options.version        = options.version        || "0.14.0";
        options.players.online = options.players.online || 0;
        options.players.max    = options.players.max    || 20;
        this.serverId          = options.serverId       || 536734; // uhh todo--make better?
        options.gamemode       = options.gamemode       || "Survival"; // is this right?
        
        
        this.name = [
            "MCPE",
            options.name,
            options.protocol,
            options.version,
            options.players.online,
            options.players.max,
            "PocketNode",
            options.gamemode
        ].join(";");

        this.buffer = new ByteBuffer();
        this.getByteBuffer().buffer[0] = MessageIdentifiers.ID_UNCONNECTED_PONG;
        this.getByteBuffer().offset = 1;
    }
    
    encode(){
        this.getByteBuffer()
            .writeLong(this.pingId)
            .writeLong(this.serverId);

        this.writeMagic();

        this.getByteBuffer()
            .writeShort(this.name.length)
            .writeString(this.name)
            .flip()
            .compact();
    }
}

module.exports = UnconnectedPong;