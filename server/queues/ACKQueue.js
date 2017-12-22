class ACKQueue extends Map {
    add(v){
        this.set(v, true);
    }

    remove(v){
        this.delete(v);
    }

    getAll(){
        return Array.from(this.keys());
    }

    isEmpty(){
        return this.size === 0;
    }
}

module.exports = ACKQueue;