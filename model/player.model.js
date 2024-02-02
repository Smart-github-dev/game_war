const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const player = new mongoose.Schema({
    name: String,
    password: String,
    email: String,
    balance: Number,
    currency: String,
    status: { type: String, default: "active" },
    walletadress: String,
    score: { type: Number, default: 0 },
    discordId: String,
    createdAt: String,
    updatedAt: String
});

player.methods.checkPassword = function (password) {
    const user = this;
    // Compare the plaintext password with the hashed password
    return bcrypt.compare(password, user.password);
};


module.exports = mongoose.model(
    "players",
    player
);
