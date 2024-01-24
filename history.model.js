const mongoose = require("mongoose");

const model = mongoose.model(
    "historys",
    new mongoose.Schema({
        name: String,
    })
);

module.exports = model;
