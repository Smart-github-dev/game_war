const mongoose = require("mongoose");

const model = mongoose.model(
    "players",
    new mongoose.Schema({
        name: String,
        password: String,
        created: String
    })
);

module.exports = model;
