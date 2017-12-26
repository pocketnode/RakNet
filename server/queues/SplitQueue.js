const EncapsulatedPacket = require("../../protocol/EncapsulatedPacket");

class SplitQueue extends Map {
    add(pk){
        CheckTypes([EncapsulatedPacket, pk]);

        if(this.has(pk.splitId)){
            let m = this.get(pk.splitId);
            m.set(pk.splitIndex, pk);
            this.set(pk.splitId, m);
        }else{
            let m = new Map([[pk.splitIndex, pk]]);
            this.set(pk.splitId, m);
        }
    }

    getSplitSize(splitId){
        CheckTypes([Number, splitId]);

        return this.get(splitId).size;
    }

    getSplits(splitId){
        CheckTypes([Number, splitId]);

        return this.get(splitId);
    }

    remove(splitId){
        this.delete(splitId);
    }

    isEmpty(){
        return this.size === 0;
    }
}

module.exports = SplitQueue;