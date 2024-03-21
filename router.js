const express = require("express");
const PlayerModel = require("./model/player.model.js");
const HistoryModel = require("./model/history.model.js");
const { verifyJWT, getHas } = require("./utills.js");
const router = express.Router();

// router.post("/players", async function (req, res) {
//     try {
//         const players = await PlayerModel.find({}, 'name score status avatar createdAt updatedAt');
//         res.json(players);
//     } catch (err) {
//         res.json(err)
//     }
// })

router.get("/players/rankings", async function (req, res) {
    try {
        const players = await PlayerModel.find({ status: "active" }, 'name score status avatar');
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
});


// router.post("/player/change_pass", async function (req, res) {
//     try {
//         const { newpassword, oldpassword, token } = req.body;
//         verifyJWT(token, async function (decoded) {
//             const player = await PlayerModel.findById(decoded.id);
//             if (player) {
//                 const isPasswordCorrect = await player.checkPassword(oldpassword);
//                 if (isPasswordCorrect) {
//                     player.password = getHas(newpassword);
//                     await player.save();
//                     res.json({ success: true, message: "Your password changed" });
//                 } else {
//                     res.json({ success: true, message: "Your old password inaccuracy" });
//                 }
//             } else {
//                 res.json({ success: false, message: "please login again" })
//             }
//         }, function () {
//             res.json({ success: false, message: "please login again" })
//         })
//     } catch (err) {
//         console.log(err);
//         res.status(403).json({ success: false, message: err })
//     }
// })

// router.post("/players_delete/:id", async function (req, res) {
//     try {
//         const { id } = req.params;
//         const player = await PlayerModel.findByIdAndDelete(id);
//         res.json(player);
//     } catch (error) {
//         res.json(error);
//     }
// })

router.post("/historys", async function (req, res) {
    try {
        const historys = await HistoryModel.find({})
        res.json(historys);
    } catch (err) {
        res.json(err);
    }
})

// router.post("/players_all_clear", async function (req, res) {
//     try {
//         await PlayerModel.deleteMany();
//         res.json({ message: "success", success: true });
//     } catch (error) {
//         res.json(error);
//     }
// })

// router.post("/players/:id/:status", async function (req, res) {
//     const { id, status } = req.params;
//     try {
//         const result = await PlayerModel.findByIdAndUpdate(id, { status: status });
//         res.json({ message: "success", success: true, result: result });
//     } catch (err) {
//         res.json(err);
//     }
// })

// router.post("/historys_all_clear", async function (req, res) {
//     try {
//         await HistoryModel.deleteMany();
//         res.json({ message: "success", success: true });
//     } catch (err) {
//         res.json(err);
//     }
// })


module.exports = router;