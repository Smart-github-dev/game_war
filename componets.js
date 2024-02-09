'use strict';

const { HITSHIELD, HITBRICK, HITBODY, INVINCIBILITY, REALBODY, ITEMS, HIDDENBODY, ADDITEM, DELLITEM, TERRAIN_SAND, TERRAIN_EDGE, TERRAIN_GRASS, TERRAIN_LAVA, TERRAIN_WATER, TERRAIN_BRICK, TERRAIN_FLOOR } = require("./types");
const playerModel = require("./model/player.model");
const { distance, generateitemId } = require("./utills");
const cron = require('node-cron');

const {
  SHIELD,
  WEAPON1,
  WEAPON2,
  WEAPON3,
  WEAPON5,
  WEAPON6,
  WEAPON4,
  HEALTH,
  HMEDCINE
} = ITEMS;

class Terrain {
  constructor(speedArg, typeArg, damageArg, isPassableArg) {
    this.speed = speedArg;
    this.type = typeArg;
    this.damage = damageArg;
    this.isPassable = isPassableArg;
  }
}


const sand = new Terrain(4, TERRAIN_SAND, 0, 1);
const edge = new Terrain(3, TERRAIN_EDGE, 0, 0);
const grass = new Terrain(5.5, TERRAIN_GRASS, 0, 1);
const water = new Terrain(3, TERRAIN_WATER, 0, 1);
const lava = new Terrain(8, TERRAIN_LAVA, 5, 1);
const brick = new Terrain(3, TERRAIN_BRICK, 0, 0);
const floor = new Terrain(6, TERRAIN_FLOOR, 0, 1);

class Point {
  constructor(xArg, yArg) {
    this.x = xArg;
    this.y = yArg;
  }
}

class Map {
  constructor() {
    this.square = [];
    this.heightInSquares = 100;
    this.widthInSquares = 100;
    for (let i = 0; i < this.heightInSquares; i++) {
      this.square[i] = [];
      for (let j = 0; j < this.widthInSquares; j++) {
        if (i == 0 || j == 0 || i == 99 || j == 99)
          this.square[i][j] = brick;
        else
          this.square[i][j] = grass;

      }
    }
    this.createArea(new Point(1, 1), 50, 0.75, sand);
    this.createArea(new Point(10, 30), 200, 0.75, sand);
    this.createArea(new Point(97, 50), 1000, 0.65, sand);
    this.createArea(new Point(50, 20), 500, 0.65, sand);
    this.createArea(new Point(10, 50), 500, 0.80, sand);
    this.createArea(new Point(97, 97), 1000, 0.90, water);
    this.createArea(new Point(20, 30), 200, 0.75, water);
    this.createArea(new Point(20, 5), 100, 0.75, water);
    this.createArea(new Point(50, 50), 800, 0.60, water);
    this.createArea(new Point(50, 90), 800, 0.65, lava);
    this.createArea(new Point(2, 2), 30, 0.65, lava);
    this.createWall(50, 10, 4, "horizontally");
    this.createWall(80, 30, 4, "vertically");

    this.createBuilding(15, 15, 10, 10, 2);
    this.createBuilding(20, 20, 15, 20, 3);
    this.createBuilding(45, 45, 10, 10, 18);
    this.createBuilding(60, 10, 30, 10, 9);
    this.createBuilding(20, 80, 40, 5, 7);
    this.createBridge(80, 80, 10);
    this.createBuilding(3, 43, 20, 15, 2);

  }

  createArea(center, size, randomness, type) { ///using a DFS algorithm
    let queue = [];
    queue.push(center);
    let currentSize = 0;
    while (queue.length != 0 && currentSize < size) {
      let current = queue.shift();
      if (this.square[current.y][current.x] === type)
        continue;
      this.square[current.y][current.x] = type;
      currentSize++;

      if (Math.random() <= randomness && current.x + 1 >= 1 && current.x + 1 <= 98 && current.y >= 1 && current.y <= 98 && this.square[current.x + 1][current.y] !== type) {
        let currentNew = new Point(current.x + 1, current.y);
        queue.push(currentNew);
      }
      if (Math.random() <= randomness && current.x >= 1 && current.x <= 98 && current.y + 1 >= 1 && current.y + 1 <= 98 && this.square[current.x][current.y + 1].type !== type) {
        let currentNew = new Point(current.x, current.y + 1);
        queue.push(currentNew);
      }
      if (Math.random() <= randomness && current.x - 1 >= 1 && current.x - 1 <= 98 && current.y >= 1 && current.y <= 98 && this.square[current.x - 1][current.y].type !== type) {
        let currentNew = new Point(current.x - 1, current.y);
        queue.push(currentNew);
      }
      if (Math.random() <= randomness && current.x >= 1 && current.x <= 98 && current.y - 1 >= 1 && current.y - 1 <= 98 && this.square[current.x][current.y - 1].type !== type) {
        let currentNew = new Point(current.x, current.y - 1);
        queue.push(currentNew);
      }
    }
  }

  createBuilding(x, y, width, height, numberOfDoors) {

    this.createWall(x, y, width, "horizontally");
    this.createWall(x, y + height - 1, width, "horizontally");
    this.createWall(x, y, height, "vertically");
    this.createWall(x + width - 1, y, height, "vertically");

    while (numberOfDoors--) {
      let doorsX, doorsY;
      switch (Math.floor(Math.random() * 4)) {
        case 0://east
          doorsX = x + width - 1;
          doorsY = y + Math.floor(Math.random() * (height - 4)) + 1;
          this.square[doorsY][doorsX] = floor;
          this.square[doorsY + 1][doorsX] = floor;
          break;

        case 1://north
          doorsX = x + Math.floor(Math.random() * (width - 4)) + 1;
          doorsY = y;
          this.square[doorsY][doorsX] = floor;
          this.square[doorsY][doorsX + 1] = floor;

          break;

        case 2://west
          doorsX = x;
          doorsY = y + Math.floor(Math.random() * (height - 4)) + 1;
          this.square[doorsY][doorsX] = floor;
          this.square[doorsY + 1][doorsX] = floor;
          break;

        case 3://south
          doorsX = x + Math.floor(Math.random() * (width - 4)) + 1;
          doorsY = y + height - 1;
          this.square[doorsY][doorsX] = floor;
          this.square[doorsY][doorsX + 1] = floor;
          break;
      }

    }//numberOfDoors is changed now

    for (let i = 1; i < height - 1; i++) {
      for (let j = 1; j < width - 1; j++) {
        this.square[y + i][x + j] = floor;
      }
    }
  }

  createBridge(x, y, size) {
    this.createWall(x, y, size, "vertically");
    this.createWall(x + size - 1, y, size, "vertically");
    for (let i = 1; i < size - 1; i++) {
      for (let j = 1; j < size - 1; j++) {
        this.square[x + i][y + j] = floor;
      }
    }
  }

  createWall(x, y, length, direction) {
    for (let i = 0; i < length; i++) {
      if (this.square[y][x + i] != floor && direction == 'horizontally') {
        this.square[y][x + i] = brick;
        continue;
      }
      if (this.square[y + i][x] != floor && direction == 'vertically') {
        this.square[y + i][x] = brick;
      }
    }
  }
}

class Player {
  constructor(xArg, yArg, healthArg, directionArg, nameArg, id) {
    this.id = id;
    this.x = xArg;
    this.y = yArg;
    this.health = healthArg;
    this.direction = directionArg;
    this.name = nameArg;
    this.take = new Pistol();
    this.score = 0;
    this.killedBy = "notAPlayer";
    this.r = 20;
    this.status = INVINCIBILITY;
    this.statusTime = 176;
  }

  pickUpItem(item, items, changed) {
    if (!(this.take instanceof Pistol))
      this.dropItem(items, changed);
    this.take = item;
  }

  dropItem(items, changed) {
    let dirX = -1;
    if (Math.random() > 0.5)
      dirX = 1;
    let dirY = -1;
    if (Math.random() > 0.5)
      dirY = 1;
    this.take.x = this.x + 100 * dirX;
    this.take.y = this.y + 100 * dirY;
    if (!(this.take instanceof Pistol)) {
      changed.push({
        ...{
          type: ADDITEM,
          take: {
            id: this.take.id,
            type: this.take.type,
            x: parseInt(this.take.x),
            y: parseInt(this.take.y)
          }
        }
      });
      items.push(this.take);
    }
  }

}

class Bullet {
  constructor(xArg, yArg, directionArg, damageArg, ownerArg) {
    this.x = xArg;
    this.y = yArg;
    this.direction = directionArg;
    this.speed = 25;
    this.range = 800;
    this.distanceTraveled = 0;
    this.damage = damageArg;
    this.owner = ownerArg;
    this.id = generateitemId('b')
  };
}

class BulletPhysics {
  constructor() {
    this.bullets = [];
  }

  update(map, hits) {
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].x += parseFloat(this.bullets[i].speed * Math.cos(this.bullets[i].direction));
      this.bullets[i].y += parseFloat(this.bullets[i].speed * Math.sin(this.bullets[i].direction));
      this.bullets[i].distanceTraveled += this.bullets[i].speed;
      if (!map.square[Math.floor((this.bullets[i].y) / 50)][Math.floor((this.bullets[i].x) / 50)]?.isPassable) {
        hits.push([HITBRICK, parseInt(this.bullets[i].x), parseInt(this.bullets[i].y)]);
        this.bullets.splice(i, 1);
        i--;
      }
    }
  }

  checkRange() {
    let length = this.bullets.length;
    for (let i = 0; i < length; i++) {
      if (this.bullets[i].distanceTraveled >= this.bullets[i].range) {
        this.bullets.splice(i, 1);
        length--;
        i--;
      }
    }
  }

  checkHits(players, hits) {
    for (let j = 0; j < players.length; j++) {
      let player = players[j];
      for (let i = 0; i < this.bullets.length; i++) {
        if (player.take instanceof Shield) {
          if (distance(this.bullets[i].x, this.bullets[i].y, player.take.x, player.take.y) < player.take.spriteWidth) {
            hits.push([HITSHIELD, parseInt(this.bullets[i].x), parseInt(this.bullets[i].y)]);
            this.bullets.splice(i, 1);
            return;
          }
        }
        if (this.bullets[i].owner != player.id) {
          if (this.bullets[i].x >= player.x - 15 &&
            this.bullets[i].x <= player.x + 15 &&
            this.bullets[i].y >= player.y - 15 &&
            this.bullets[i].y <= player.y + 15) {
            if (player.status !== INVINCIBILITY) {
              hits.push([HITBODY, parseInt(this.bullets[i].x), parseInt(this.bullets[i].y), this.bullets[i].damage]);
              player.health -= this.bullets[i].damage;
              if (player.health <= 0)
                player.killedBy = this.bullets[i].owner;
            } else {
              hits.push([HITSHIELD, parseInt(this.bullets[i].x), parseInt(this.bullets[i].y)]);
            }
            this.bullets.splice(i, 1);
            i--;
          }
        }
      }
    }
  }
}

class Item {
  constructor(x, y, id) {
    this.id = id;
    this.x = x;
    this.y = y;
  }
  pos() {

  }
}

class Items {
  constructor(mapSquares) {
    this.array = [];
    this.generateItems(100, mapSquares);
  };

  checkCollisions(players, changed) {
    for (let j = 0; j < players.length; j++) {
      let player = players[j];
      for (let i = 0; i < this.array.length; i++) {
        if (this.array[i].x >= player.x - this.array[i].spriteWidth && this.array[i].x <= player.x + this.array[i].spriteWidth && this.array[i].y >= player.y - this.array[i].spriteHeight && this.array[i].y <= player.y + this.array[i].spriteHeight) {
          if (this.array[i] instanceof Weapon || this.array[i] instanceof Shield) {
            player.pickUpItem(this.array[i], this.array, changed);
            changed.push({
              ...{
                type: DELLITEM,
                id: this.array[i].id
              }
            });
            this.array.splice(i, 1);
            i--;
          }
          else if (this.array[i].apply(player)) {
            changed.push({
              ...{
                type: DELLITEM,
                id: this.array[i].id
              }
            });
            this.array.splice(i, 1);
            i--;
          }
        }
      }
    }
  };

  addtools(amount, mapSquares) {
    for (let i = 0; i < amount; i++) {
      let item = new Item();
      switch (Math.floor(Math.random() * 2)) {
        case 0:
          item = new HealthPack();
          break;
        case 1:
          item = new HiddenMedicine();
          break;
      }
      let newX, newY;
      do {
        newX = Math.random() * 5000;
        newY = Math.random() * 5000;
      } while (!mapSquares[Math.floor(newX / 50)][Math.floor(newY / 50)].isPassable);

      item.x = newX;
      item.y = newY;
      item.id = generateitemId(this.array.length);
      this.array.push(item);
    }
  }

  generateItems(amount, mapSquares) {
    let gatling = new Gatling();
    gatling.x = 2500;
    gatling.y = 2500;
    gatling.id = generateitemId(this.array.length);
    this.array.push(gatling);
    for (let i = 0; i < amount; i++) {
      let item = new Item();
      switch (Math.floor(Math.random() * 7)) {

        case 0:
          item = new DoublePistol();
          break;

        case 1:
          item = new Rifle();
          break;

        case 2:
          item = new Revolver();
          break;

        case 3:
          item = new Smg();
          break;

        case 4:
          item = new HealthPack();
          break;
        case 5:
          item = new Shield();
          break;
        case 6:
          item = new HiddenMedicine();
          break;
      }
      let newX, newY;
      do {
        newX = Math.random() * 5000;
        newY = Math.random() * 5000;
      } while (!mapSquares[Math.floor(newX / 50)][Math.floor(newY / 50)].isPassable);

      item.x = newX;
      item.y = newY;
      item.id = generateitemId(this.array.length);
      this.array.push(item);
    }
  }

}

class HealthPack extends Item {
  constructor() {
    super();
    this.healthGain = 500;
    this.type = HEALTH;
    this.spriteWidth = 50;
    this.spriteHeight = 50;
  }
  apply(player) {
    if (player.health < 1000) {
      player.health += this.healthGain;
      if (player.health > 1000) {
        player.health = 1000;
      }
      return true;
    }
    return false;
  }
}

class HiddenMedicine extends Item {
  constructor() {
    super();
    this.type = HMEDCINE;
    this.spriteWidth = 20;
    this.spriteHeight = 50;
    this.hiddentime = 200;
  }
  apply(player) {
    if (player.status == REALBODY) {
      player.statusTime = this.hiddentime;
      player.status = HIDDENBODY;
      return true;
    }
    return false;
  }
}

class Tool extends Item {
  constructor() {
    super();
  }

  pos() {
  }
}

module.exports.Tool = Tool;

class Shield extends Tool {
  constructor(type, rate) {
    super();
    this.type = SHIELD;
    this.spriteWidth = 20;
    this.spriteHeight = 60;
    this.triggered = 0;
    this.distance = 30;
  }

  pos(player) {
    this.x = player.x + this.distance * Math.cos(player.direction);
    this.y = player.y + this.distance * Math.sin(player.direction);
  }
  apply(obj) {
    if (!this.triggered) {
      this.triggered = 1;
    }
  }

  run(obj) {
    if (obj instanceof Bullet) {
      if (distance(obj.x, obj.y, this.x, this.y) < this.spriteWidth) {
        return true
      }
    }
    return false;
  }

}

class Weapon extends Item {
  constructor(dmg, acc, fRate) {
    super();
    this.damage = dmg;
    this.accuracy = acc;
    this.spriteName = "null";
    this.triggered = 0;
    this.lastShot = new Date();
    this.fireRate = fRate; // in miliseconds
  };

  setBulletStats(bullet) {
    bullet.damage = this.damage;
  }
}

class AutomaticWeapon extends Weapon {
  constructor(dmg, acc, fireRate) {
    super(dmg, acc, fireRate);
  };

  apply(x, y, direction, bulletPhysics, shooter, player) {
    if (statusApply(player)) {
      return;
    }
    let time = new Date();
    if (time - this.lastShot >= this.fireRate) {
      this.lastShot = time;
      let spread = (Math.random() - 0.5) * Math.PI * (100 - this.accuracy) / 100;
      let bullet = new Bullet(x + 30 * Math.cos(direction), y + 30 * Math.sin(direction), direction + spread, this.damage, shooter);
      this.setBulletStats(bullet);
      bulletPhysics.bullets.push(bullet);
    }
  }
}

class SemiAutomaticWeapon extends Weapon {
  constructor(dmg, acc, fireRate) {
    super(dmg, acc, fireRate);
  };

  apply(x, y, direction, bulletPhysics, shooter, player) {
    if (statusApply(player)) {
      return;
    }
    let time = new Date();
    if (!this.triggered && time - this.lastShot >= this.fireRate) {
      this.lastShot = time;
      let spread = (Math.random() - 0.5) * Math.PI * (100 - this.accuracy) / 100;
      let bullet = new Bullet(x + 30 * Math.cos(direction), y + 50 * Math.sin(direction), direction + spread, this.damage, shooter);
      this.setBulletStats(bullet);
      bulletPhysics.bullets.push(bullet);
      this.triggered = 1;
    }
  }
}

class Pistol extends SemiAutomaticWeapon {
  constructor() {
    super(100, 95, 400);
    this.type = WEAPON1;
    this.spriteName = "pistol";
    this.spriteWidth = 30;
    this.spriteHeight = 18;
  }
}

class Revolver extends SemiAutomaticWeapon {
  constructor() {
    super(250, 100, 500);
    this.type = WEAPON6;
    this.spriteName = "revolver";
    this.spriteWidth = 40;
    this.spriteHeight = 20;
  }
}

class DoublePistol extends SemiAutomaticWeapon {
  constructor() {
    super(300, 95, 400);
    this.type = WEAPON2;
    this.spriteName = "doublePistols";
    this.spriteWidth = 30;
    this.spriteHeight = 30;
  }

  apply(x, y, direction, bulletPhysics, shooter, player) {
    if (statusApply(player)) {
      return;
    }
    let time = new Date();
    if (!this.triggered && time - this.lastShot >= this.fireRate) {
      this.lastShot = time;
      let spread1 = (Math.random() - 0.5) * Math.PI * (100 - this.accuracy) / 100;
      let bullet1 = new Bullet(x + 20 * Math.cos(direction + Math.PI / 2) + 35 * Math.cos(direction), y + 20 * Math.sin(direction + Math.PI / 2) + 35 * Math.sin(direction), direction + spread1, this.damage, shooter);
      this.setBulletStats(bullet1);
      bulletPhysics.bullets.push(bullet1);
      let spread2 = (Math.random() - 0.5) * Math.PI * (100 - this.accuracy) / 100;
      let bullet2 = new Bullet(x - 20 * Math.cos(direction + Math.PI / 2) + 35 * Math.cos(direction), y - 20 * Math.sin(direction + Math.PI / 2) + 35 * Math.sin(direction), direction + spread2, this.damage, shooter);
      this.setBulletStats(bullet2);
      bulletPhysics.bullets.push(bullet2);
      this.triggered = 1;
    }
  }
}

class Rifle extends AutomaticWeapon {
  constructor() {
    super(200, 98, 150);
    this.type = WEAPON3;
    this.spriteName = "rifle";
    this.spriteWidth = 73;
    this.spriteHeight = 18;
  }

}

class Smg extends AutomaticWeapon {
  constructor() {
    super(70, 80, 50);
    this.type = WEAPON4;
    this.spriteName = "smg";
    this.spriteWidth = 50;
    this.spriteHeight = 20;
  }
}

class Gatling extends AutomaticWeapon {
  constructor() {
    super(150, 70, 15);
    this.type = WEAPON5;
    this.spriteName = "gatling";
    this.spriteWidth = 90;
    this.spriteHeight = 33;
  }
}


class Entry {
  constructor(name, id, score, dbid) {
    this.name = name;
    this.id = id;
    this.score = score;
    this.dbid = dbid || null
  }
}




class Leaderboard {
  constructor() {
    this.array = [];
  }

  addEntry(name, id, score, did) {
    this.array.push(new Entry(name, id, score, did));
    return this.sort();
  }

  addPoint(id) {
    for (let i = 0; i <= this.array.length; i++) {
      if (this.array[i]?.id == id) {
        this.array[i].score++;
        if (this.array[i].dbid != null) {
          addScore(this.array[i].dbid);
        }
        break;
      }
    }
    return this.sort();
  }

  remove(id) {
    for (let i = 0; i <= this.array.length; i++) {
      if (this.array[i]?.id == id) {
        this.array.splice(i, 1);
        break;
      }
    }
    return this.array;
  }

  sort() {
    this.array = this.array.sort(function (a, b) {
      return b.score - a.score;
    });
    return this.array;
  }
}


class Model {
  constructor() {
    this.map = new Map();
    this.items = new Items(this.map.square);
    this.leaderboard = new Leaderboard();

    cron.schedule('0/5 * * * *', () => {
      if (this.items.array.length < 100) {
        this.items.addtools(50, this.map.square);
      }
    });
  };

  getLeaderboard() {
    return this.leaderboard;
  }

  getMap() {
    return this.map;
  }
  getItems() {
    return this.items;
  }


  getNewPlayer(xArg, yArg, healthArg, directionArg, nameArg, id) {
    return new Player(xArg, yArg, healthArg, directionArg, nameArg, id);
  }

  getBulletPhysics() {
    return new BulletPhysics();
  }

  getBullet(xArg, yArg, directionArg) {
    return new Bullet(xArg, yArg, directionArg);
  }

  getItemInfos() {
    let itemInfos = {

    };
    return itemInfos;
  }
}

module.exports = Model;

function statusApply(player) {
  if (player.status == INVINCIBILITY) {
    return true;
  }
  if (player.status == HIDDENBODY) {
    player.status = REALBODY;
  }
  return false;
}


async function addScore(id) {
  try {
    await playerModel.findByIdAndUpdate(id, { $inc: { score: 1 } });
  } catch (error) {
    console.log(error)
  }
}



