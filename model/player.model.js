const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const player = new mongoose.Schema({
    name: String,
    password: String,
    email: String,
    balance: Number,
    currency: String,
    status: String,
    walletadress: String,
    score: String,
    createdAt: String,
    updatedAt: String
});

player.pre('save', function (next) {
    const user = this;

    // Generate a salt for the password
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }

        // Hash the password using the salt
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                return next(err);
            }

            // Replace the plaintext password with the hashed password
            user.password = hash;

            // Continue with the save operation
            next();
        });
    });
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

