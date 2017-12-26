const Datagram = require("../../protocol/Datagram");

class RecoveryQueue extends Map {
    addRecoveryFor(datagram){
        CheckTypes([Datagram, datagram]);

        this.set(datagram.sequenceNumber, datagram);
    }

    isRecoverable(seqNumber){
        CheckTypes([Number, seqNumber]);

        return this.has(seqNumber);
    }

    recover(sequenceNumbers){
        CheckTypes([Array, sequenceNumbers]);

        let datagrams = [];

        sequenceNumbers.forEach(seqNumber => {
            if(this.isRecoverable(seqNumber)){
                datagrams.push(this.get(seqNumber));
            }
        });

        return datagrams;
    }

    remove(seqNumber){
        this.delete(seqNumber);
    }

    isEmpty(){
        return this.size === 0;
    }
}

module.exports = RecoveryQueue;