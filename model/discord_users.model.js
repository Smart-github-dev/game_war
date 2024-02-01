const mongoose = require("mongoose");

const DiscordUser = new mongoose.Schema({
    username: String,
    userId: String,
    tag: String,
    createdAt: String,
    updatedAt: String
});


module.exports = mongoose.model(
    "d_users",
    DiscordUser
);
