const mongoose = require("mongoose");

const DB_HOST=process.env.DB_HOST;
const DB_PORT=process.env.DB_PORT;
const DB_NAME=process.env.DB_NAME;

module.exports = (callback) => {
    mongoose
        .connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("Successfully connect to MongoDB.");
            callback();
        })
        .catch((err) => {
            console.error("Connection error", err);
            process.exit();
        });

};