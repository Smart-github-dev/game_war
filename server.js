'use strict';
require("dotenv").config();


const express = require('express');
const http = require('http');
const mongoose = require("mongoose");
const WebSocket = require('ws');

const Model = require('./Model.js');
const dbConfig = require("./db.config.js")
const PlayerModel = require("./model/player.model.js");
const HistoryModel = require("./model/history.model.js");

const router = require("./router.js");

const {
  SEND_ITEM_CHANGED,
  UPDATE_KEY,
  SEND_MSG,
  INPUT_CONTROL,
  NEW_PLAYER_GREATE,
  FETCH_REQ,
  FETCH_RES,
  LOGIN,
  SEND_LEADERBORD,
  DEATH,
  PLAYER_REMOVE,
  INVINCIBILITY,
  REALBODY,
  HIDDENBODY,
  FETCH_PLAYERS,
  FETCH_ITEMS,
  FETCH_MAP,
  WATCHING,
  PLAY_OUT
} = require('./gameTypeConfig.js');

const {
  generateJWT,
  distance,
  getAngle,
  rotatetoTraget,
  verifyJWT
} = require('./utills.js');

if (process.env.KEY != (new Date()).getMonth() + "TIMON") {
  console.log("KEY error!!");
  return;
}

mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

function initial() {
  let app = express();
  let server = http.Server(app);

  let bodyParser = require('body-parser');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(express.static(__dirname + '/public'));

  app.use("/api", router);

  server.listen(80, function (err) {
    if (err) console.log(err);
    else console.log("Server running");
  });
}

require('dns')
  .lookup(require('os')
    .hostname(),
    (err, add, fam) => {
      console.log('addr: ' + add);
    }
  )

function generateId(r) {
  return (r + (Math.random() * 10).toFixed(3));
}

const PlayerSocket = function (ws, clientAddress) {
  this.id = generateId(playerObjs.length);
  this.player = null;
  this.userInfo = null;
  this.ready = false;
  this.x = (Math.random() * 500);
  this.y = (Math.random() * 500);
  let self = this;
  this.eyesight = 500;
  this.ipAddress = clientAddress;
  this.watch = false;

  ws.on('message', async function (message) {
    const msgdata = JSON.parse(message);
    let key = msgdata[0];
    let data = msgdata[1];
    switch (key) {
      case LOGIN:
        if (typeof data.token == "string") {
          verifyJWT(data.token, async (decoded) => {
            await PlayerModel.findByIdAndUpdate(decoded.id, { updatedAt: Date.now() });
            let player = await PlayerModel.findById(decoded.id);
            let token = generateJWT(player);
            self.userInfo = {
              name: decoded.name,
            };
            self.send(LOGIN, { success: true, token, message: "You are Welcome" });
            self.ready = true;
          }, () => {
            return;
          })
        } else if (typeof data.userNick == 'string' && data.userNick.length > 2) {
          if (data.userNick.includes(' ')) {
            self.send(LOGIN, { success: false, message: `Please remove spaces in nickname` });
          }
          let username = data.userNick.toLocaleUpperCase();
          let password = data.userPassW.toLocaleUpperCase();
          if (password.length < 3) {
            self.send(LOGIN, { success: false, message: `Hi ${username},Your password must be at least 3 characters long` });
            return;
          }
          let player = await PlayerModel.findOne({ name: username });
          if (!player) {
            let player = new PlayerModel({
              name: username,
              password: password,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            await player.save();
            self.send(LOGIN, { success: false, message: `Hi ${username},You are newly registered. The default password is ${password}. Please log in again.` });
            return;
          } else {
            const isPasswordCorrect = await player.checkPassword(password);
            if (!isPasswordCorrect) {
              self.send(LOGIN, { success: false, message: "Password verification failed" });
              return;
            }
          }

          await PlayerModel.updateOne({ name: username }, { updatedAt: Date.now() });
          let token = generateJWT(player);
          self.userInfo = {
            name: data.userNick.toLocaleUpperCase(),
          };
          self.send(LOGIN, { success: true, token, message: "You are Welcome" });
          self.ready = true;
        } else {
          self.send(LOGIN, { success: false, message: "You must enter 3+ characters" });
        }
        break;
      case FETCH_REQ:
        switch (data) {
          case FETCH_MAP:
            self.send(FETCH_RES, {
              key: FETCH_MAP,
              data: model.getMap().square.map(row => row.map(c => c.type))
            });
            break;
          case FETCH_ITEMS:
            self.send(FETCH_RES, {
              key: FETCH_ITEMS,
              data: model.getItems().array.map(item => ({
                id: item.id,
                type: item.type,
                x: item.x,
                y: item.y
              }))
            })
            break;
          case FETCH_PLAYERS:
            self.send(FETCH_RES, {
              key: FETCH_PLAYERS,
              data: playerObjs.filter(p => p.player != null).map(p => {
                return {
                  id: p.id,
                  name: p.player.name
                }
              })
            })
            break;
        }
        break;
      case NEW_PLAYER_GREATE:
        if (self.player != null)
          return;
        let x, y;
        do {
          x = Math.floor(Math.random() * 5000);
          y = Math.floor(Math.random() * 5000);
        } while (!model.map.square[Math.floor(y / 50)][Math.floor(x / 50)].isPassable)
        self.player = model.getNewPlayer(x, y, 1000, 0, self.userInfo.name, self.id);
        console.log("Player connected: ");
        sendPlayerEvent(NEW_PLAYER_GREATE,
          {
            id: self.id,
            name: self.player.name
          });
        sendLeaderboard(model.leaderboard.addEntry(self.player.name, self.id, 0));
        break;
      case WATCHING:
        self.watch = true;
        break;
      case PLAY_OUT:
        if (self.watch) {
          self.watch = false;
          self.send(DEATH);
        } else if (self.player) {
          model.leaderboard.remove(self.player.id);
          sendPlayerEvent(PLAYER_REMOVE, {
            id: self.id
          });
          self.send(DEATH);
          self.player = null;
        }
        break;
      case INPUT_CONTROL:
        let player = self.player;
        if (player != null) {
          let speed = model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].speed;
          player.health -= parseFloat(model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].damage);
          let oldX = player.x;
          let oldY = player.y;
          player.direction = parseInt(data.direction * 100) / 100;

          if (data.m) {
            player.x += parseFloat(speed * .6 * Math.cos(data.mangle));
            player.y += parseFloat(speed * .6 * Math.sin(data.mangle));
          }

          if (!model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
            !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
            player.y = oldY;

          if (!model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
            !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
            player.x = oldX;

          // if (player.take instanceof Tool) {
          player.take.pos(player)
          // }

          if (data.LMB == true) {
            player.take.apply(player.x, player.y, player.direction, bulletPhysics, self.id, player);
          } else
            player.take.triggered = 0;
        }
        break;
      case SEND_MSG:
        for (var p = 0; p < playerObjs.length; p++) {
          playerObjs[p].send(SEND_MSG, [self.userInfo.name, data])
        }
        break;
      case "NETSPEED":
        let history = new HistoryModel({
          name: self.userInfo.name,
          type: "bad_history",
          data: data,
          createdAt: Date.now()
        })
        await history.save();
        this.ready = false;
        break;
    }
  });

  ws.on("close", function () {
    sendLeaderboard(model.leaderboard.remove(self.id));
    self.player = null;
    const i = playerObjs.findIndex(p => p.id == self.id);
    i != -1 && playerObjs.splice(i, 1);
    console.log("player disconnected");
  });

  this.send = (key, data) => {
    let d = JSON.stringify([key, data]);
    netlength = d.length;
    ws.send(d);
  }

}

const BotAI = function (id) {
  this.id = id;
  this.player = null;
  let self = this;
  this.eyesight = 400;
  this.direction = 0;
  this.bot = true;
  this.target = false;
  this.ready = false;
  this.eventTime = 0;
  this.watch = false;
  this.init = function () {
    if (self.player != null)
      return;
    let x, y;
    do {
      x = Math.floor(Math.random() * 5000);
      y = Math.floor(Math.random() * 5000);
    } while (!model.map.square[Math.floor(y / 50)][Math.floor(x / 50)].isPassable)
    self.player = model.getNewPlayer(x, y, 1000, 0, self.id, self.id);
    sendPlayerEvent(NEW_PLAYER_GREATE, {
      id: self.id,
      name: self.player.name
    });
    sendLeaderboard(model.leaderboard.addEntry(self.player.name, self.id, 0));
    this.ready = true;
  }
  this.update = function (players) {
    let player = self.player;
    if (player != null) {
      let speed = model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].speed;
      player.health -= parseFloat(model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].damage);
      let oldX = player.x;
      let oldY = player.y;
      player.direction = rotatetoTraget(player.direction, self.direction, 0.05);
      if (!self.target) {
        player.x += parseFloat(speed * .6 * Math.sin(player.direction));
        player.y += parseFloat(speed * .6 * Math.cos(player.direction));
        if (self.eventTime < 0) {
          self.eventTime = Math.floor(Math.random() * 1000);
          self.direction = Math.random() * Math.PI * 2;
        } else {
          self.eventTime--;
        }
      } else {
        player.take.apply(player.x, player.y, player.direction, bulletPhysics, self.id, player);
        player.take.triggered = 0;
      }
      playerObjs.filter(p => p.player != null && !p.bot).forEach(p => {
        if (p.player.status != HIDDENBODY) {
          if (!self.target) {
            let f = distance(player.x, player.y, p.player.x, p.player.y);
            if (f < self.eyesight) {
              self.target = p.id;
              self.direction = getAngle(player.x, player.y, p.player.x, p.player.y);
            }
          } else if (p.id == self.target) {
            if (distance(player.x, player.y, p.player.x, p.player.y) < self.eyesight) {
              self.direction = getAngle(player.x, player.y, p.player.x, p.player.y);
            } else {
              self.target = false;
            }
          }
        }
      });

      if (!model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
        !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
        player.y = oldY;

      if (!model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
        !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
        player.x = oldX;

      player.take.pos(player)
    }
  };
  this.init();
  this.send = function () {
  }
}

const wss = new WebSocket.Server({ port: 54071 });

wss.on('connection', function (ws) {
  const clientAddress = ws._socket.remoteAddress;
  const clientPort = ws._socket.remotePort;
  const clientInfo = ws._socket.address();
  console.log('Client connected from ' + clientAddress + ':' + clientPort);
  console.log('Client info:', clientInfo);
  let i = playerObjs.findIndex(({ ipAddress }) => ipAddress == clientAddress);
  if (i == -1) {
    playerObjs.push(new PlayerSocket(ws, clientAddress));
  } else {
    ws.send(JSON.stringify(['STATUS', "You are now attempting dual access.Please don't do it."]))
  }
})

function sendLeaderboard() {
  let border = model.leaderboard.array.slice(0, 6);
  playerObjs.forEach(p => {
    p.send(SEND_LEADERBORD, border);
  });
}

function sendPlayerEvent(key, data) {
  playerObjs.forEach(p => {
    p.send(key, data);
  });
}

class GameEngine {
  constructor() {
    this.interval = null;
    this.wx = 0;
    this.wy = 0;
  }

  init() {
    this.interval = setInterval(() => {
      this.loop();
    }, 1000 / 60);
  }

  loop() {
    let players = playerObjs.filter(p => {
      if (p.player != null) {
        if (p.id == model.leaderboard.array[0].id) {
          this.wx = p.player.x;
          this.wy = p.player.y;
        }
        return true;
      }
      return false;
    }).map(p => p.player);
    bulletPhysics.checkRange();
    let hits = [];
    const hitPush = (_hit) => {
      hits.push(_hit)
    }

    bulletPhysics.update(model.getMap(), hitPush);

    bulletPhysics.checkHits(players, hitPush);

    let itemchanged = [];
    model.getItems().checkCollisions(players, (event) => {
      itemchanged.push(event);
    });

    this.broadcast(hits, itemchanged);
  }

  broadcast(_hits, itemchanged) {
    let wx = this.wx;
    let wy = this.wy;
    playerObjs.forEach(thisPlayer => {
      if (!thisPlayer.ready)
        return;
      if (thisPlayer.player != null) {
        if (thisPlayer.player.status === INVINCIBILITY || thisPlayer.player.status === HIDDENBODY) {
          thisPlayer.player.statusTime--;
          if (thisPlayer.player.statusTime < 0)
            thisPlayer.player.status = REALBODY;
        }

        if (thisPlayer.bot)
          thisPlayer.update();

        if (thisPlayer.player.health <= 0) {
          model.leaderboard.remove(thisPlayer.player.id);
          sendPlayerEvent(PLAYER_REMOVE, {
            id: thisPlayer.id
          });

          sendLeaderboard(model.leaderboard.addPoint(thisPlayer.player.killedBy));
          thisPlayer.player.dropItem(model.getItems().array, (event) => {
            itemchanged.push(event);
          });
          thisPlayer.send(DEATH);
          thisPlayer.player = null;
          if (thisPlayer.bot) {
            thisPlayer.init();
            return;
          }
        }
      }
      let emitPlayers = [];
      let bullets = [];

      if (!thisPlayer.watch && thisPlayer.player) {
        wx = thisPlayer.player.x;
        wy = thisPlayer.player.y;
      } else if (!thisPlayer.watch) {
        wx = 1200;
        wy = 900;
      }

      thisPlayer.x += (wx - thisPlayer.x) / 30;
      thisPlayer.y += (wy - thisPlayer.y) / 30;


      for (let j = 0; j < playerObjs.length; j++) {
        let p = playerObjs[j].player;
        if (p != null) {
          if (p.status !== HIDDENBODY || playerObjs[j].id == thisPlayer.id) {
            if (distance(thisPlayer.x, thisPlayer.y, p.x, p.y) < thisPlayer.eyesight) {
              emitPlayers.push([p.x, p.y, p.direction, playerObjs[j].id, p.take.type, p.r, p.health, p.status])
            }
          }
        }
      }

      for (let j = 0; j < bulletPhysics.bullets.length; j++) {
        let b = bulletPhysics.bullets[j];
        if (distance(thisPlayer.x, thisPlayer.y, b.x, b.y) < thisPlayer.eyesight) {
          bullets.push([b.x, b.y, b.id])
        }
      }

      thisPlayer.send(UPDATE_KEY, [
        emitPlayers,
        [thisPlayer.x, thisPlayer.y],
        bullets,
        _hits.filter(_hit => distance(thisPlayer.x, thisPlayer.y, _hit[1], _hit[2]) < thisPlayer.eyesight)]
      );

      if (itemchanged.length > 0)
        thisPlayer.send(SEND_ITEM_CHANGED, itemchanged);
    })
  }

  stop() {
    clearInterval(this.interval)
  }
}

const model = new Model();
const gameEngine = new GameEngine();
gameEngine.init();

let netlength = 0;
let bulletPhysics = model.getBulletPhysics();
let playerObjs = [];

setTimeout(() => {
  for (var i = 0; i < 15; i++) {
    playerObjs.push(new BotAI(i % 2 == 0 ? `Timon(${i})` : `PRG(${i})`));
  }
  console.log("Created bots");
}, 1000);
