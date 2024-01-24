'use strict';
class Controller {
  constructor() {
    this.squareWidthInPixels = 50;
    this.squareHeightInPixels = 50;
    this.width = 1000;         // default: 800
    this.height = 700;
    this.playerSpriteWidth = 50;
    this.playerSpriteHeight = 50;
    this.mode = 'alive';
    this.padding = 50;
    this.initGame = function () {

    }
  }

  fetchData(callback) {
    socket.send('fetch_req');
    this.initGame = callback;
  }

  newPlayer() {
    socket.send('new_player');
  }

  emitInput() {
    setInterval(function () {
      socket.send('input', input);
    }, 1000 / 60);
  }

  listenToFetchRes() {
    socket.listens["fetch_res"] = function (data) {
      items = data.items.map(item => ({
        id: item.id,
        type: item.type,
        x: item.x,
        y: item.y,
        direction: (Math.random() * (0 - 360)) * (Math.PI / 180)
      }));

      gameMap.square = data.map.map(r => r.map(c => new Terrain(`client/sprites/${c}.png`)));

      controller.initGame();
    }
  }

  listenToItemChange() {
    socket.listens["items_change"] = function (data) {
      console.log(data);
      for (var i = 0; i < data.length; i++) {
        if (data[i].type == "dell") {
          let j = items.findIndex(item => item.id == data[i].id);
          if (j != -1) {
            items.splice(j, 1);
          }
        } else if (data[i].type == "add") {
          items.push({
            id: data[i].weapon.id,
            type: data[i].weapon.type,
            x: data[i].weapon.x,
            y: data[i].weapon.y,
            direction: (Math.random() * (0 - 360)) * (Math.PI / 180)
          });
        }
      }
    }
  }

  listenLeaderboard() {
    socket.listens['leaderbord'] = function (data) {
      console.log(data);
      leaderboard = data;
    }
  }

  listenToUpdate() {
    socket.listens['update'] = function (data) {
      players = data[0];
      camera.x = data[1][0];
      camera.y = data[1][1];
      bullets = data[2];
    }
  }

  listenToChat() {
    socket.listens['msg'] = function (data) {
      var chatBox = document.getElementById("chat-box");
      chatBox.scrollTop = chatBox.scrollHeight;
      let div = document.createElement("div");
      div.className = "text-white"
      div.innerHTML = `@${data[0]}:> ${data[1]}`;
      chatBox.appendChild(div)
    }
  }

  listenToDeath() {
    socket.listens['death'] = function () {
      controller.mode = "dead";
    }
  }
}


class Point {
  constructor(xArg, yArg) {
    this.x = xArg;
    this.y = yArg;
  }
}

class GameMap {
  constructor() {
    this.square = [];
    this.heightInSquares = 17;
    this.widthInSquares = 21;
  }
}

class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.health = 100;
    this.direction = Math.PI;
    this.name = 'null';
  }
}

class CurrentPlayer extends Player {
  constructor() {
    super();
  }
}

class Bullet {
  constructor(xArg, yArg, directionArg) {
    this.x = xArg;
    this.y = yArg;
    this.direction = directionArg;
    this.speed = 15;
    this.range = 100;
    this.distanceTraveled = 0;
  };
}

class Entry {
  constructor(name, socketId, score) {
    this.name = name;
    this.socketId = socketId;
    this.score = score;
  }
}
