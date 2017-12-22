const BitFlags = {
    VALID: 0x80,
    ACK: 0x40,
    NAK: 0x20,
    PACKET_PAIR: 0x10,
    CONTINUOUS_SEND: 0x08,
    NEEDS_B_AND_AS: 0x04
};

module.exports = BitFlags;