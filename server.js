'use strict';

let Model = require('./static/server/Model.js');
let model = new Model();
let express = require('express');
let http = require('http');
let path = require('path');
const mongoose = require("mongoose");

const dbConfig = require("./db.config.js")
const PlayerModel = require("./player.model.js");
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

  app.use(express.static(__dirname + '/static'));

  server.listen(80, function (err) {
    if (err) console.log(err);
    else console.log("Server running");
  });
}

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: ' + add);
})


function generateId() {
  return Date.now() + "player";
}

const PlayerSocket = function (ws) {
  this.id = generateId();
  this.player = null;
  this.userInfo = null;
  this.logined = false;
  this.x = (Math.random() * 500);
  this.y = (Math.random() * 500);
  let self = this;
  this.eyesight = 500;
  ws.on('message', async function (message) {
    const { key, data } = JSON.parse(message);
    switch (key) {
      case LOGIN:
        if (typeof data.userNick == 'string' && data.userNick.length > 2) {
          let username = data.userNick.toLocaleUpperCase();
          let player = await PlayerModel.findOne({ name: username });
          let password = data.userPassW.toLocaleUpperCase();
          if (!player) {
            let newPlayer = new PlayerModel({
              name: username,
              password: password,
              created: Date.now()
            });
            await newPlayer.save();
          }
          self.userInfo = {
            name: data.userNick.toLocaleUpperCase(),
            pass: data.userPassW.toLocaleUpperCase(),
          };
          self.send(LOGIN, { success: true });
          self.logined = true;
        } else {
          self.send(LOGIN, { success: false, message: "You must enter 3+ characters" });
        }
        break;
      case FETCH_REQ:
        self.send(FETCH_RES, {
          items: model.getItems().array.map(item => ({
            id: item.id,
            type: item.type,
            x: item.x,
            y: item.y
          })),
          map: model.getMap().square.map(row => row.map(c => c.type))
        }
        )
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
        model.leaderboard.addEntry(self.player.name, self.id, 0);
        sendLeaderboard();
        break;
      case INPUT_CONTROL:
        let player = self.player;
        if (player != null) {
          let speed = model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].speed;
          player.health -= parseFloat(model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].damage);
          let oldX = player.x;
          let oldY = player.y;
          player.direction = parseFloat(data.direction);

          if (data.m) {
            player.x += parseFloat(speed * Math.sin(data.mangle));
            player.y += parseFloat(speed * Math.cos(data.mangle));
          }

          if (!model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
            !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
            player.y = oldY;

          if (!model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
            !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
            player.x = oldX;

          if (data.LMB == true) {
            player.weapon.shoot(player.x, player.y, player.direction, bulletPhysics, self.id);
          } else
            player.weapon.triggered = 0;
        }
        break;
      case SEND_MSG:
        for (var p = 0; p < playerObjs.length; p++) {
          playerObjs[p].send("msg", [self.userInfo.name, data])
        }
        break;
    }
  });
  ws.on("close", function () {
    for (let i = 0; i < model.leaderboard.array.length; i++) {
      if (model.leaderboard.array[i].socketId == self.id) {
        model.leaderboard.array.splice(i, 1);
        sendLeaderboard();
        break;
      }
    }
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

let netlength = 0;
let bulletPhysics = model.getBulletPhysics();
let playerObjs = [];

const WebSocket = require('ws');
const { SEND_ITEM_CHANGED, UPDATE_KEY, SEND_MSG, INPUT_CONTROL, NEW_PLAYER_GREATE, FETCH_REQ, FETCH_RES, LOGIN, SEND_LEADERBORD } = require('./gameTypeConfig.js');
const wss = new WebSocket.Server({ port: 54071 });

wss.on('connection', function (ws) {
  const clientAddress = ws._socket.remoteAddress;
  const clientPort = ws._socket.remotePort;
  const clientInfo = ws._socket.address();
  console.log('Client connected from ' + clientAddress + ':' + clientPort);
  console.log('Client info:', clientInfo);
  playerObjs.push(new PlayerSocket(ws));
})


setInterval(function () {
  let players = playerObjs.filter(p => p.player != null).map(p => p.player);
  bulletPhysics.checkRange();
  bulletPhysics.update(model.getMap());
  bulletPhysics.checkHits(players);

  let itemchanged = [];
  const itemChanged = (event) => {
    itemchanged.push(event);
  }

  model.getItems().checkColissions(players, itemChanged);

  if (itemchanged.length > 0) {
    playerObjs.forEach(p => {
      p.send(SEND_ITEM_CHANGED, itemchanged);
    })
  }

  loop();
}, 1000 / 60);

function loop() {
  playerObjs.forEach(thisPlayer => {
    if (thisPlayer.logined) {
      if (thisPlayer.player != null) {
        if (thisPlayer.player.health <= 0) {
          let k = playerObjs.findIndex(p => p.id == thisPlayer.player.killedBy);
          if (k != -1) {
            model.leaderboard.addPoint(thisPlayer.player.killedBy);
          }

          for (let i = 0; i < model.leaderboard.array.length; i++) {
            if (model.leaderboard.array[i].socketId == thisPlayer.id) {
              model.leaderboard.array.splice(i, 1);
            }
          }

          sendLeaderboard();
          thisPlayer.player.dropItem(model.getItems().array);
          thisPlayer.send('death');
          thisPlayer.player = null;
        }
      }
      let emitPlayers = [];
      let bullets = [];
      let playerx = thisPlayer.player?.x | 0;
      let playery = thisPlayer.player?.y | 0;
      let angle = thisPlayer.player?.direction | 0;
      if (playerx == 0 && playery == 0) {
        thisPlayer.x += (1200 - thisPlayer.x + 200 * Math.cos(angle)) / 30;
        thisPlayer.y += (900 - thisPlayer.y + 200 * Math.sin(angle)) / 30;
      } else {
        thisPlayer.x += (playerx - thisPlayer.x + 200 * Math.cos(angle)) / 30;
        thisPlayer.y += (playery - thisPlayer.y + 200 * Math.sin(angle)) / 30;
      }
      for (let j = 0; j < playerObjs.length; j++) {
        let p = playerObjs[j].player;
        if (p != null) {
          if (distance(thisPlayer.x, thisPlayer.y, p.x, p.y) < thisPlayer.eyesight) {
            emitPlayers.push([p.x, p.y, p.direction, p.name, p.weapon.type, p.r, p.health])
          }
        }
      }

      for (let j = 0; j < bulletPhysics.bullets.length; j++) {
        let b = bulletPhysics.bullets[j];
        if (distance(thisPlayer.x, thisPlayer.y, b.x, b.y) < thisPlayer.eyesight) {

          bullets.push([b.x, b.y, b.direction])
        }
      }

      thisPlayer.send(UPDATE_KEY, [emitPlayers, [thisPlayer.x, thisPlayer.y], bullets]);
    }
  })
}


function sendLeaderboard() {
  playerObjs.forEach(p => {
    p.send(SEND_LEADERBORD, model.leaderboard.array);
  });
}

function distance(x1, y1, x2, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  return distance;
}
