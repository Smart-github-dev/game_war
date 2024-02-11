'use strict';

const playerinfokey = {
  x: 0,
  y: 1,
  direction: 2,
  id: 3,
  itemType: 4,
  size: 5,
  health: 6,
  status: 7
}

class Controller {
  constructor() {
    this.squareWidthInPixels = 50;
    this.squareHeightInPixels = 50;
    this.width = 1000;         // default: 800
    this.height = 700;
    this.mode = 'alive';
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = 0;
    this.intervalTime = null;
    this.bsc = 0;
    this.processCashs = [];
    this.effects = [];
    this.status = "ready";
    this.settings = {
      audio: true,
      music: false,
      roomid: null,
      key: {
        up: 87,
        down: 83,
        left: 65,
        right: 68
      }
    }
    this.gameMap = new GameMap();
    this.smallMap = new SmallMapDraw();
    this.touchCtl;

    this.rooms = [];
    this.players = [];
    this.bullets = [];
    this.items = [];
    this.camera = {
      x: 0,
      y: 0
    }
    this.leaderboard = new LeaderBoard();
    this.initGame = function () { }
  }

  fetchRooms() {
    socket.send(ROOMS);
  }

  fetchData(callback) {
    socket.send(FETCH_REQ, FETCH_MAP);
    this.initGame = callback;
  }

  joinRequest(id) {
    if (this.settings.roomid != id) {
      socket.send(JOIN_ROOM, id);
    }
  }

  newPlayer() {
    socket.send(NEW_PLAYER_GREATE);
  }

  emitInput() {
    let self = this;
    this.intervalTime = setInterval(function () {
      if (self.status == "play") {
        socket.send(INPUT_CONTROL, input);
      }
    }, 1000 / 60);
  }

  stopInput() {
    clearInterval(this.intervalTime);
  }

  listenToJoined() {
    let self = this;
    socket.listens[JOIN_ROOM] = function (id) {
      self.settings.roomid = id;
      self.clear();
      showRoom();
      loadingshow();
      self.fetchData(function () {
        loadinghidden();
      });
    }
  }

  listenToFetchRes() {
    let self = this;

    // bulletContainer.removeChild();
    // trailContainer.removeChild();

    // effectContainer.removeChild();

    socket.listens[FETCH_RES] = function (data) {
      if (data.key == FETCH_MAP) {
        mapContainer.removeChild();
        controller.gameMap.square = data.data.map(r => r.map(c => new Terrain(c)));
        socket.send(FETCH_REQ, FETCH_ITEMS);
      }
      if (data.key == FETCH_ITEMS) {
        // itemContainer.removeChild();
        data.data.forEach(item => {
          self.items.push(new Item(
            item.id,
            item.type,
            item.x,
            item.y,
            (Math.random() * (0 - 360)) * (Math.PI / 180)
          ))
        })
        socket.send(FETCH_REQ, FETCH_PLAYERS);
      }
      if (data.key == FETCH_PLAYERS) {
        playerBContainer.removeChild();
        playerWContainer.removeChild();
        playerHContainer.removeChild();
        data.data.map(p => {
          self.players.push(new Player(p))
        });
        self.initGame();
      }
    }
  }

  listenToPlayerEvent() {
    let self = this;
    socket.listens[NEW_PLAYER_GREATE] = function (data) {
      self.processCashs.push({
        type: PLAYER_CHANGE_EVENT,
        data: { key: ADDPLAYER, data }
      });
      self.players.push(new Player(data));
    }
    socket.listens[PLAYER_REMOVE] = function (data) {
      self.processCashs.push({
        type: PLAYER_CHANGE_EVENT,
        data: { key: DELLPLAYER, data }
      });
    }
  }

  listenToItemChange() {
    let self = this;
    socket.listens[SEND_ITEM_CHANGED] = function (data) {
      self.processCashs.push({
        type: ITEM_CHANGE_EVENT,
        data: data
      });
    }
  }

  listenLeaderboard() {
    socket.listens[SEND_LEADERBORD] = function (data) {
      controller.leaderboard.update(data);
    }
  }

  listenToUpdate() {
    let self = this;
    socket.listens[UPDATE_KEY] = function (data) {
      if (self.frameCount == 0) {
        self.lastTime = Date.now();
      } else {
        self.lastTime += Date.now();
      }
      self.frameCount++;

      self.camera.x = data[1];
      self.camera.y = data[2];
      let offx = self.camera.x - center.offx;
      let offy = self.camera.y - center.offy;

      self.players.forEach(p => {
        let j = data[0].findIndex(_p => _p[playerinfokey.id] == p.id);
        if (j != -1) {
          p.update(data[0][j]);
        } else {
          p.hidePlayer();
        }
      })

      self.items.forEach(item => item.update());

      let bulletDatas = data[3];
      let updatedBullets = [];
      for (let bullet of self.bullets) {
        let index = bulletDatas.findIndex(bulletData => bulletData[2] == bullet.id);
        if (index != -1) {
          bullet.update(bulletDatas[index][0], bulletDatas[index][1]);
          self.addTrailParticle(bulletDatas[index][0], bulletDatas[index][1])
          bulletDatas.splice(index, 1);
          updatedBullets.push(bullet);
        } else {
          bulletContainer.removeChild(bullet.sprite);
        }
      }

      self.bullets = updatedBullets;

      bulletContainer.x = - offx;
      bulletContainer.y = - offy;
      trailContainer.x = -offx;
      trailContainer.y = -offy;

      itemContainer.x = -offx;
      itemContainer.y = -offy;


      for (let k = 0; k < bulletDatas.length; k++) {
        self.bullets.push(new Bullet(bulletDatas[k][2], bulletDatas[k][0], bulletDatas[k][1]))
      }

      let hits = data[4];


      hits.forEach(hit => {
        if (hit[0] == HITBODY) {
          self.effects.push(new BodyHit(hit));
        } else if (hit[0] == HITSHIELD) {
          self.effects.push(new ShieldHit(hit));
        } else if (hit[0] == HITBRICK) {
          self.effects.push(new BrickHit(hit));
        }
      })
      self.smallMap.update(self.camera.x, self.camera.y)
    }
  }

  listenToChat() {
    socket.listens[SEND_MSG] = function (data) {
      var chatBox = document.getElementById("chat-box");
      chatBox.scrollTop = chatBox.scrollHeight;
      let div = document.createElement("div");
      div.className = "text-white"
      div.innerHTML = `@${data[0]}:> ${data[1]}`;
      chatBox.appendChild(div)
    }
  }

  listenToDeath() {
    let self = this;
    socket.listens[DEATH] = function () {
      self.status = "ready";
      $("#main-page").show(200);
      document.body.style.cursor = 'auto';
    }
  }

  listenToRoomDatas() {
    self = this;
    socket.listens[ROOMS] = function (data) {
      self.rooms = data;
      showRoom();
    }
  }



  sendNetSpeed(lastTime, fps, frameCount, deltaTime) {
    socket.send("NETSPEED", {
      lastTime, fps, frameCount, deltaTime
    })
  }

  update() {
    if (this.mode == "timeout") {
      return;
    }



    this.effects.forEach((effect, i) => {
      effect.update();
      if (effect.disable) {
        this.effects.splice(i, 1);
      }
    })
    let offx = this.camera.x - center.offx;
    let offy = this.camera.y - center.offy;


    effectContainer.x = -offx;
    effectContainer.y = -offy;
    this.mapDraw();
    this.processing();
    this.updateTrail();
    if (this.status == "play" || this.status == "watch") {

      let timestamp = Date.now();
      let deltaTime = timestamp - this.lastTime;

      if (deltaTime > 2000) {
        this.bsc = 55;
      }

      if (this.frameCount > 10) {
        deltaTime = (timestamp - this.lastTime) / this.frameCount;
        if (deltaTime > 80) {
          this.fps = 1000 / deltaTime
          console.log("FPS: " + this.fps, "SPEED:" + deltaTime);
          this.bsc == 55;
        }
        this.frameCount = 0;
      }

      if (this.bsc > 50) {
        this.mode = "timeout";
        this.stopInput()
        toast("Internet speed is bad.")
        this.sendNetSpeed(this.lastTime, this.fps, this.frameCount, deltaTime);
      }
      this.touchCtl.update(this.status == "play");
    }
  }

  mapDraw() {
    if (this.gameMap.square.length == 0)
      return;
    let tileSize = this.squareWidthInPixels;
    mapContainer.removeChildren();
    const starti = Math.floor(this.camera.y / tileSize);
    const startj = Math.floor(this.camera.x / tileSize);
    let offx = this.camera.x % tileSize;
    let offy = this.camera.y % tileSize;
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 21; j++) {
        let square = this.gameMap.square[Math.min(Math.max(starti - 7 + i, 0), 99)]
        [Math.min(Math.max(startj - 10 + j, 0), 99)].sprite;
        square.x = tileSize * j;
        square.y = tileSize * i;
        mapContainer.addChild(square);
      }
    }
    mapContainer.x = -offx;
    mapContainer.y = -offy;
  }

  processing() {
    this.processCashs.forEach((event, i) => {
      if (event.type == PLAYER_CHANGE_EVENT) {
        if (this.playerEvent(event.data.key, event.data.data)) {
          this.processCashs.splice(i, 1);
        }
      }
      if (event.type == ITEM_CHANGE_EVENT) {
        event.data = event.data.filter(item => !this.itemsChange(item));
        if (event.data.length == 0) {
          this.processCashs.splice(i, 1);
        }
      }
    });
  }

  playerEvent(key, data) {
    if (key == ADDPLAYER) {
      this.players.push(new Player(data));
      return true;
    }
    if (key == DELLPLAYER) {
      let i = this.players.findIndex(p => p.id == data.id);
      if (i != -1) {
        if (distance(this.players[i].x, this.players[i].y, this.camera.x, this.camera.y) < this.width / 2)
          this.effects.push(new Explosion(this.players[i].x, this.players[i].y))
        this.players[i].removePlayer();
        this.players.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  itemsChange(_item) {
    if (_item.type == DELLITEM) {
      let j = this.items.findIndex(item => item.id == _item.id);
      if (j != -1) {
        this.items[j].removeitem();
        this.items.splice(j, 1);
        return true;
      }
    } else if (_item.type == ADDITEM) {
      this.items.push(new Item(
        _item.take.id,
        _item.take.type,
        _item.take.x,
        _item.take.y,
        (Math.random() * (0 - 360)) * (Math.PI / 180)
      ));
      return true;
    }
    return false;
  }


  addTrailParticle(x, y) {
    let trailParticle = new PIXI.Graphics();
    trailParticle.beginFill(0xff661a);
    trailParticle.drawCircle(0, 0, 3);
    trailParticle.endFill();
    trailParticle.position.set(x, y);
    trailContainer.addChild(trailParticle);
  }

  updateTrail() {
    trailContainer.children.forEach((trailParticle) => {
      trailParticle.alpha -= 0.15;
      trailParticle.scale.x *= 0.95;
      trailParticle.scale.y *= 0.95;
      if (trailParticle.alpha <= 0) {
        trailContainer.removeChild(trailParticle)
      }
    });
  }

  settingUp(key, value) {
    this.settings[key] = value;
    localStorage.setItem("game_setting", JSON.stringify(this.settings));
  }

  clear() {
    this.players = [];
    this.bullets = [];
    this.items = [];
    this.processCashs = [];
    mapContainer.removeChild();
    itemContainer.removeChild();
    bulletContainer.removeChild();
    trailContainer.removeChild();
    playerBContainer.removeChild();
    playerWContainer.removeChild();
    playerHContainer.removeChild();
    effectContainer.removeChild();
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
  constructor(p) {
    this.id = p.id;
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.health = 100;
    this.direction = Math.PI;
    this._name = p.name;
    this.name = null;
    this.player = null;
    this.take = null;
    this.border = null;
    this.redBar = null;
    this.greenBar = null;
    this.status = REALBODY;
    this.setup('player');
  }

  setup(type) {
    // this.player = new PIXI.extras.AnimatedSprite(playerAnimationframes[type]);
    // this.player.animationSpeed = 0.2;
    // this.player.anchor.set(0.5, 0.5);

    this.player = new PIXI.Graphics();


    this.border = new PIXI.Graphics();

    this.take = new PIXI.Sprite(PIXI.loader.resources['pistol'].texture);
    this.take.anchor.set(0.5, 0.5);

    this.name = new PIXI.Text(this._name);

    this.name.style = { fontSize: 16, fill: 'white', stroke: 'black', strokeThickness: 1 };
    this.name.anchor.set(0.5, 0.5);
    this.redBar = new PIXI.Graphics();
    this.greenBar = new PIXI.Graphics();

    this.header = new PIXI.Container();

    playerFContainer.addChild(this.border);
    playerBContainer.addChild(this.player);
    playerWContainer.addChild(this.take);
    this.header.addChild(this.name);
    this.header.addChild(this.redBar);
    this.header.addChild(this.greenBar);
    playerHContainer.addChild(this.header);
    this.hidePlayer();
  }

  showPlayer() {
    this.border.visible = true;
    this.player.visible = true;
    this.take.visible = true;
    this.header.visible = true;
  }

  update(info) {
    if (!this.player.visible) {
      this.showPlayer();
    }

    let offx = controller.camera.x - center.offx;
    let offy = controller.camera.y - center.offy;

    this.health = info[playerinfokey.health];
    let x = info[playerinfokey.x] - offx;
    let y = info[playerinfokey.y] - offy;
    // this.player.width = info[playerinfokey.size] * 2;
    // this.player.height = info[playerinfokey.size] * 2;


    this.player.clear();
    this.player.lineStyle(2, 0x1a1a1a, .5);
    this.player.beginFill(0xffaa00);
    this.player.drawCircle(x, y, info[playerinfokey.size]);
    this.player.endFill();
    // this.player.position.set(x, y);

    // playerSprite.rotation = player[playerinfokey.direction];
    this.status = info[playerinfokey.status];
    let _distance = itemInfos[info[playerinfokey.itemType]].distance;
    this.take.position.set(x + _distance * Math.cos(info[playerinfokey.direction]), y + _distance * Math.sin(info[playerinfokey.direction]));
    this.border.clear();

    if (this.status == INVINCIBILITY) {
      this.border.beginFill(0xd9d9d9, .6);
      this.border.drawCircle(x, y, info[playerinfokey.size] + 3);
    } else {
      this.border.beginFill(0x0099ff, .1);
      this.border.drawCircle(x, y, info[playerinfokey.size] + 5);
    }

    this.border.endFill();

    this.name.position.set(x, y - 55);

    this.redBar.clear();
    this.redBar.beginFill(0xFF0000, 1);
    this.redBar.drawRect(x - 40, y - 40, 80, 10);
    this.redBar.endFill();

    this.greenBar.clear();
    this.greenBar.beginFill(0x00ff00, .9);
    this.greenBar.drawRect(x - 40, y - 40, Math.max(0, this.health * (80 / 1000)), 10);
    this.greenBar.endFill();

    if (this.status == HIDDENBODY) {
      this.player.alpha = 0.3;
      this.take.alpha = 0.3;
      this.header.alpha = 0.3;
    } else {
      this.player.alpha = 1;
      this.take.alpha = 1;
      this.header.alpha = 1;
    }

    // if (distance(this.x, this.y, info[playerinfokey.x], info[playerinfokey.y]) > 0.1) {
    //   this.x = info[playerinfokey.x];
    //   this.y = info[playerinfokey.y];
    //   if (!this.player.playing) {
    //     this.player.play();
    //   }
    // } else {
    //   if (this.player.playing) {
    //     this.player.stop();
    //   }
    // }

    this.take.rotation = info[playerinfokey.direction];
    this.take.width = itemInfos[info[playerinfokey.itemType]].w;
    this.take.height = itemInfos[info[playerinfokey.itemType]].h;
    this.take.texture = PIXI.Texture.from(itemInfos[info[playerinfokey.itemType]].sprite);
  }

  hidePlayer() {
    this.border.visible = false;
    this.player.visible = false;
    this.take.visible = false;
    this.header.visible = false;
  }

  removePlayer() {
    playerFContainer.removeChild(this.border);
    playerBContainer.removeChild(this.player);
    playerWContainer.removeChild(this.take);
    playerHContainer.removeChild(this.header);
  }
}

class Item {
  constructor(id, type, xArg, yArg, direction) {
    this.id = id;
    this.type = type;
    this.x = xArg;
    this.y = yArg;
    let iteminfo = itemInfos[type];
    this.itemSprite = new PIXI.Sprite(PIXI.loader.resources[iteminfo.sprite].texture);
    this.itemSprite.anchor.set(0.5, 0.5);
    this.itemSprite.x = this.x;
    this.itemSprite.y = this.y;
    this.itemSprite.width = iteminfo.w;
    this.itemSprite.height = iteminfo.h;
    this.itemSprite.rotation = direction;
    this.itemSprite.visible = false;
    itemContainer.addChild(this.itemSprite);
  }

  update() {
    if (distance(this.x, this.y, controller.camera.x, controller.camera.y) < controller.width / 2) {

      if (!this.itemSprite.visible) {
        this.itemSprite.visible = true;
      }
    } else if (this.itemSprite.visible) {
      this.itemSprite.visible = false;
    }
  }

  removeitem() {
    itemContainer.removeChild(this.itemSprite);
  }
}

class Bullet {
  constructor(id, xArg, yArg) {
    this.id = id;
    this.x = xArg;
    this.y = yArg;
    // this.direction = directionArg;
    this.speed = 15;
    this.range = 100;
    this.distanceTraveled = 0;
    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(0xff3300); // Red color
    this.sprite.lineStyle(1, 0xff9933); // Black outline
    this.sprite.drawCircle(xArg, yArg, 3);
    this.sprite.endFill();
    bulletContainer.addChild(this.sprite);
  };

  update(x, y) {
    this.sprite.clear();
    this.sprite.beginFill(0xff3300); // Red color
    this.sprite.lineStyle(1, 0xff9933); // Black outline
    this.sprite.drawCircle(x, y, 4);
    this.sprite.endFill();
  }
}

class Entry {
  constructor(name, socketId, score) {
    this.name = name;
    this.socketId = socketId;
    this.score = score;
  }
}

class LeaderBoard {
  constructor() {
    this.stage = new PIXI.Container();
    // let leaderboardBackground = new PIXI.Graphics();
    // leaderboardBackground.lineStyle(.5, 0x0073e6, 0.7);
    // leaderboardBackground.beginFill('black', 0.3);
    // leaderboardBackground.drawRoundedRect(790, 10, 200, 200, 10);
    // leaderboardBackground.endFill();
    // this.stage.addChild(leaderboardBackground);

    let leaderboardVerticalLine = new PIXI.Graphics();
    leaderboardVerticalLine.beginFill(0x0073e6, 0.7);
    leaderboardVerticalLine.drawRect(930, 20, 2, 180);
    leaderboardVerticalLine.endFill();
    this.stage.addChild(leaderboardVerticalLine);

    let leaderboardHorizontalLine = new PIXI.Graphics();

    leaderboardHorizontalLine.beginFill(0x0073e6, 0.7);
    leaderboardHorizontalLine.drawRect(800, 40, 180, 2);
    leaderboardHorizontalLine.endFill();

    this.stage.addChild(leaderboardHorizontalLine);

    let leaderboardTitle = new PIXI.Text("NICK              KILLS");
    leaderboardTitle.style = { fill: 'white', strokeThickness: 0, fontSize: 13 };
    leaderboardTitle.position.set(850, 20);
    this.stage.addChild(leaderboardTitle);

    this.playercound = new PIXI.Text("0");
    this.playercound.anchor.set(0.5, 0.5);
    this.playercound.style = { fill: 'red', strokeThickness: 0, fontSize: 13 };
    this.playercound.position.set(950, 15);
    this.stage.addChild(this.playercound);

    this.ldeaderData = [];
    for (let i = 0; i < 7; i++) {
      let entryName = new PIXI.Text("bot1");
      entryName.anchor.set(0.5, 0.5);
      entryName.style = { fill: 'white', strokeThickness: 0, fontSize: 12 };
      entryName.position.set(860, 55 + i * 20);
      entryName.visible = false;

      this.stage.addChild(entryName);

      let entryKills = new PIXI.Text(0);
      entryKills.anchor.set(0.5, 0.5);
      entryKills.style = { fill: 'white', strokeThickness: 0, fontSize: 12 };
      entryKills.position.set(960, 55 + i * 20);
      this.stage.addChild(entryKills);
      entryKills.visible = false;

      this.ldeaderData.push([entryName, entryKills])
    }
    this.stage.x = -50;
    mainContainer.addChild(this.stage);
  }

  update(data) {
    this.playercound.text = data.count;
    for (let i = 0; i < 7; i++) {
      if (data.ranking[i]) {
        if (!this.ldeaderData[i][0].visible) {
          this.ldeaderData[i][0].visible = true;
          this.ldeaderData[i][1].visible = true;
        }
        this.ldeaderData[i][0].text = `${i + 1}. ${data.ranking[i].name}`;
        this.ldeaderData[i][1].text = data.ranking[i].score;
      } else if (this.ldeaderData[i][0].visible) {
        this.ldeaderData[i][0].visible = false;
        this.ldeaderData[i][1].visible = false;
      }
    }
  }

  removeAll() {
    mainContainer.removeChild(this.stage);
  }

}

class SmallMapDraw {
  constructor() {
    this.stage = new PIXI.Container();
    let miniMap = new PIXI.Graphics();
    miniMap.lineStyle(.5, 0x3399ff, .9);
    miniMap.beginFill('black', 0.3);
    miniMap.drawRect(880, 580, 100, 100);
    miniMap.endFill();
    this.stage.addChild(miniMap);
    this.mainPlayer = new PIXI.Graphics();
    this.stage.addChild(this.mainPlayer);
    this.stage.x = -10;
    mainContainer.addChild(this.stage);
  }

  update(x, y) {
    this.mainPlayer.clear();
    this.mainPlayer.beginFill(0x008111);
    this.mainPlayer.drawCircle(880 + x / 5000 * 100, 580 + y / 5000 * 100, 3);
    this.mainPlayer.endFill();
  }

  remove() {
    mainContainer.removeChild(this.stage);
  }
}

function TouchCtl() {
  this.leftCtl = new PIXI.Graphics();
  this.rightCtl = new PIXI.Graphics();
  this.mousePos = new PIXI.Graphics();
  this.scope = new PIXI.Sprite(PIXI.loader.resources.scope.texture);
  this.scope.anchor.set(0.5, 0.5);
  this.scope.width = 20;
  this.scope.height = 20;

  this.touch = isMobileDevice();

  ctlContainer.addChild(this.leftCtl);
  ctlContainer.addChild(this.rightCtl);
  ctlContainer.addChild(this.mousePos);
  ctlContainer.addChild(this.scope);

  this.update = function (play) {
    if (!this.touch) {
      if (!this.mousePos.visible) {
        this.mousePos.visible = true;
        this.scope.visible = true;
      }
      this.mousePos.clear();
      this.mousePos.beginFill(0x009900, .3);
      this.mousePos.drawCircle(mouseposition.x, mouseposition.y, 15);
      this.mousePos.endFill();
      this.scope.x += (mouseposition.x - this.scope.x) / 2;
      this.scope.y += (mouseposition.y - this.scope.y) / 2;
    }

    if (!play)
      return;
    if (!touchLPos.t && !touchRPos.t) {
      this.leftCtl.visible = false;
      this.rightCtl.visible = false;
      if (!this.touch) {
        let direction = {
          x: 0,
          y: 0
        }
        input.m = false;
        let key = controller.settings.key;
        if (keys && keys[key.up]) { direction.y = -1; input.m = true }
        if (keys && keys[key.down]) { direction.y = 1; input.m = true }
        if (keys && keys[key.left]) { direction.x = -1; input.m = true }
        if (keys && keys[key.right]) { direction.x = 1; input.m = true }
        if (input.m) {
          input.mangle = getAngle(0, 0, direction.x, direction.y);
        }

      }
    } else {
      if (this.mousePos.visible) {
        this.mousePos.visible = false;
        this.scope.visible = false;
      }
      if (this.touch)
        this.tuchPadDraw();
    }
  }

  this.remove = function () {
    ctlContainer.removeChild(this.leftCtl);
    ctlContainer.removeChild(this.rightCtl);
    ctlContainer.removeChild(this.scope);
    ctlContainer.removeChild(this.mousePos);
  }

  this.tuchPadDraw = function () {
    if (touchLPos.t) {
      this.leftCtl.visible = true;
      this.leftCtl.clear();
      this.leftCtl.beginFill(0xf2f2f2, .2);
      this.leftCtl.drawCircle(touchLPos.sx, touchLPos.sy, 100);
      this.leftCtl.endFill();
      this.leftCtl.beginFill(0xa6a6a6, .4);
      this.leftCtl.drawCircle(touchLPos.mx, touchLPos.my, 20);
      this.leftCtl.endFill();
    } else {
      this.leftCtl.visible = false;
    }
    if (touchRPos.t) {
      this.rightCtl.visible = true;
      this.rightCtl.clear();
      this.rightCtl.beginFill(0xf2f2f2, .2);
      this.rightCtl.drawCircle(touchRPos.sx, touchRPos.sy, 100);
      this.rightCtl.endFill();
      this.rightCtl.beginFill(0xa6a6a6, .4);
      this.rightCtl.drawCircle(touchRPos.mx, touchRPos.my, 20);
      this.rightCtl.endFill();
    } else {
      this.rightCtl.visible = false;
    }
  }
}

class Effect {
  constructor(_lift, sprite, x, y, w, h) {
    this.lifetime = _lift;
    this.sprite = sprite;
    this.sprite.width = w;
    this.sprite.height = h
    this.x = x;
    this.y = y;
    this.sprite.position.set(x, y);
    this.sprite.anchor.set(0.5, 0.5);
    effectContainer.addChild(this.sprite);
    this.disable = false;
  }
  remove() {
    effectContainer.removeChild(this.sprite);
  }
}

class Explosion extends Effect {

  constructor(x, y) {
    super(20, new PIXI.extras.AnimatedSprite(explosionFrames['explosion1']), x, y, 80, 80);
    this.sprite.animationSpeed = .3;
  }

  update() {
    if (!this.disable) {
      this.lifetime--;
      if (!this.sprite.playing) {
        this.sprite.play();
      }
      if (this.lifetime < 0) {
        this.sprite.visible = false;
        this.sprite.stop();
        this.disable = true;
        this.remove();
      }
    }
  }
}

class BodyHit extends Effect {
  constructor(data) {
    super(30, new PIXI.Sprite(PIXI.loader.resources["bodyhit"].texture), data[1], data[2] - 50, 20, 20);
    this.hitamount = new PIXI.Text(data[3]);
    this.hitamount.style = { fontSize: 14, fill: '#ff3333', strokeThickness: 1 };
    this.hitamount.anchor.set(0.5, 0.5);
    this.hitamount.position.set(this.x, this.y);
    effectContainer.addChild(this.hitamount);
  }
  update() {
    if (this.lifetime > 0) {
      this.lifetime--;
      this.sprite.alpha -= this.sprite.alpha / 5;
      this.hitamount.style.fontSize += 0.3;
      this.hitamount.alpha -= 0.058;
      this.y -= 1, 2;
      this.hitamount.position.set(this.x, this.y);
      this.sprite.width += 0.01;
      this.sprite.height += 0.01;
    }
    else if (!this.disable) {
      this.disable = true;
      effectContainer.removeChild(this.hitamount);
      this.remove();
    }
  }
}

class BrickHit extends Effect {
  constructor(data) {
    super(10, new PIXI.Sprite(PIXI.loader.resources["brickhit"].texture), data[1], data[2], 30, 30);
  }
  update() {
    if (this.lifetime > 0) {
      this.lifetime--;
      this.sprite.alpha -= this.sprite.alpha / 5;
      this.sprite.width += 0.005;
      this.sprite.height += 0.005;
    }
    else if (!this.disable) {
      this.disable = true;
      this.remove();
    }
  }
}

class ShieldHit extends Effect {
  constructor(data) {
    super(10, new PIXI.Sprite(PIXI.loader.resources["shieldhit"].texture), data[1], data[2], 20, 20);
  }
  update() {
    if (this.lifetime > 0) {
      this.lifetime--;
      this.sprite.alpha -= this.sprite.alpha / 5;
      this.sprite.width += 0.005;
      this.sprite.height += 0.005;
    }
    else if (!this.disable) {
      this.disable = true;
      this.remove();
    }
  }
}


