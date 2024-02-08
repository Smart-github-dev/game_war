const mongoose = require("mongoose");
const Map = new mongoose.Schema({
    name: String,
    author: String,
    description: String,
    preview: {
        type: String,
        default: "avatars/default.ico"
    },
    usebot: {
        type: Boolean,
        default: false
    },
    data: {
        type: Object,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: String
});

module.exports = mongoose.model(
    "Map",
    Map
);