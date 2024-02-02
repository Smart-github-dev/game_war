const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Player = new mongoose.Schema({
    userId: String,
    avatar: {
        type: String,
        default: "avatars/default.ico"
    },
    name: String,
    password: String,
    email: String,
    balance: Number,
    currency: String,
    status: { type: String, default: "active" },
    walletadress: String,
    score: { type: Number, default: 0 },
    tag: String,
    createdAt: String,
    updatedAt: String
});




Player.methods.checkPassword = function (password) {
    const user = this;
    // Compare the plaintext password with the hashed password
    return bcrypt.compare(password, user.password);
};


module.exports = mongoose.model(
    "Player",
    Player
);