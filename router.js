const express = require("express");
const PlayerModel = require("./model/player.model.js");
const HistoryModel = require("./model/history.model.js");
const router = express.Router();

router.post("/players", async function (req, res) {
    try {
        const players = await PlayerModel.find({}, 'name score status createdAt updatedAt');
        res.json(players);
    } catch (err) {
        res.json(err)
    }
})

router.post("/players/:id", async function (req, res) {
    const { id } = req.params;
    try {
        const player = await PlayerModel.findById(id, 'name score status createdAt updatedAt');
        res.json(player);
    } catch (err) {
        res.json(err)
    }
})

router.post("/players/delete", async function (req, res) {
    try {
        const { id } = req.body;
        const player = await PlayerModel.findByIdAndDelete(id);
        res.json(player);
    } catch (error) {
        res.json(error);
    }
})

router.post("/historys", async function (req, res) {
    try {
        const historys = await HistoryModel.find({})
        res.json(historys);
    } catch (err) {
        res.json(err);
    }
})

router.post("/players/clear", async function (req, res) {
    PlayerModel.remove({}, (err) => {
        if (err) {
            res.json(err);
        } else {
            res.json({ message: "success", success: true });
        }
    });
})

router.post("/players/:id/:status", async function (req, res) {
    const { id, status } = req.params;
    try {
        const result = await PlayerModel.findByIdAndUpdate(id, { status: status });
        res.json({ message: "success", success: true, result: result });
    } catch (err) {
        res.json(err);
    }
})

router.post("/historys/clear", async function (req, res) {
    try {
        await HistoryModel.deleteMany();
        res.json({ message: "success", success: true });
    } catch (err) {
        res.json(err);
    }
})


module.exports = router;