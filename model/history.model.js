const mongoose = require("mongoose");

const model = mongoose.model(
    "History",
    new mongoose.Schema({
        name: String,
        data: Object,
        createdAt: String,
        type: String
    })
);

module.exports = model;
