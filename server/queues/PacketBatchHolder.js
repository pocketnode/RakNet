class PacketBatchHolder extends Map {
    add(pk){
        this.set(this.size, pk);
    }

    getAll(){
        return Array.from(this.values());
    }

    getAllAndClear(){
        let packets = this.getAll();
        this.clear();
        return packets;
    }

    isEmpty(){
        return this.size === 0;
    }
}

module.exports = PacketBatchHolder;