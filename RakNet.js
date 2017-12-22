const RakNet = {
    VERSION: "0.0.1",
    PROTOCOL: 8,

    MAGIC: "\x00\xff\xff\x00\xfe\xfe\xfe\xfe\xfd\xfd\xfd\xfd\x12\x34\x56\x78",

    FLAG_NEED_ACK: 0x08,

    PRIORITY_NORMAL: 0,
    PRIORITY_IMMEDIATE: 1
};

module.exports = RakNet;