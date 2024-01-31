'use strict';

const {
  HITSHIELD,
  HITBRICK,
  HITBODY,
  INVINCIBILITY,
  REALBODY,
  ITEMS,
  HIDDENBODY,
  ADDITEM,
  DELLITEM
} = require("./gameTypeConfig");
const { distance } = require("./utills");


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

let sand = new Terrain(3, 'sand', 0, 1);
let edge = new Terrain(3, 'edge', 0, 0);
let grass = new Terrain(5, 'grass', 0, 1);
let water = new Terrain(2, 'water', 0, 1);
let lava = new Terrain(7, 'lava', 5, 1);
let brick = new Terrain(3, 'brick', 0, 0);
let floor = new Terrain(5, 'floor', 0, 1);

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
          this.square[i][j] = edge;
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
    this.r = 30;
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
      let oldw = {
        ...{
          type: ADDITEM,
          take: {
            id: this.take.id,
            type: this.take.type,
            x: parseInt(this.take.x),
            y: parseInt(this.take.y)
          }
        }
      }
      changed && changed(oldw);
      items.push(this.take);
    }
  }

}

class Bullet {
  constructor(xArg, yArg, directionArg, damageArg, ownerArg) {
    this.x = xArg;
    this.y = yArg;
    this.direction = directionArg;
    this.speed = 20;
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

  update(map, hitPush) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const nextX = bullet.x + bullet.speed * Math.cos(bullet.direction);
      const nextY = bullet.y + bullet.speed * Math.sin(bullet.direction);
      bullet.distanceTraveled += bullet.speed;

      const squareX = Math.floor(nextX / 50);
      const squareY = Math.floor(nextY / 50);
      if (map.square[squareY] && map.square[squareY][squareX] && !map.square[squareY][squareX].isPassable) {
        hitPush([HITBRICK, parseInt(nextX), parseInt(nextY)]);
        this.bullets.splice(i, 1);
      } else {
        bullet.x = nextX;
        bullet.y = nextY;
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

  checkHits(players, hitPush) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const bulletX = parseInt(bullet.x);
      const bulletY = parseInt(bullet.y);
      for (let j = 0; j < players.length; j++) {
        const player = players[j];
        if (bullet.owner !== player.id) {
          const minX = player.x - player.r / 2;
          const maxX = player.x + player.r / 2;
          const minY = player.y - player.r / 2;
          const maxY = player.y + player.r / 2;
          if (bulletX >= minX && bulletX <= maxX && bulletY >= minY && bulletY <= maxY) {
            if (player.take instanceof Tool && player.take.run(bullet)) {
              hitPush([HITSHIELD, bulletX, bulletY]);
            } else {
              if (player.status !== INVINCIBILITY) {
                player.health -= bullet.damage;
                if (player.health <= 0) {
                  player.killedBy = bullet.owner;
                }
                hitPush([HITBODY, bulletX, bulletY, bullet.damage]);
              } else {
                hitPush([HITSHIELD, bulletX, bulletY]);
              }
            }
            this.bullets.splice(i, 1);
            break;
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
      for (let i = this.array.length - 1; i >= 0; i--) {
        let bullet = this.array[i];
        if (bullet.x >= player.x - bullet.spriteWidth &&
          bullet.x <= player.x + bullet.spriteWidth &&
          bullet.y >= player.y - bullet.spriteHeight &&
          bullet.y <= player.y + bullet.spriteHeight) {
          if (bullet instanceof Weapon || bullet instanceof Shield) {
            player.pickUpItem(bullet, this.array, changed);
            changed({
              ...{
                type: DELLITEM,
                id: bullet.id
              }
            });
            this.array.splice(i, 1);
          }
          else if (bullet.apply(player)) {
            changed({
              ...{
                type: DELLITEM,
                id: bullet.id
              }
            });
            this.array.splice(i, 1);
          }
        }
      }
    }
  };

  generateItems(amount, mapSquares) {
    let gatling = new Gatling();
    gatling.x = 2500;
    gatling.y = 2500;
    gatling.id = generateitemId(this.array.length);
    this.array.push(gatling);
    for (let i = 0; i < amount; i++) {
      let item = new Item();
      switch (Math.floor(Math.random() * 8)) {

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
          item = new HealthPack();
          break;
        case 6:
          item = new Shield();
          break;
        case 7:
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
    super(300, 95, 400);
    this.type = WEAPON1;
    this.spriteWidth = 30;
    this.spriteHeight = 18;
  }
}

class Revolver extends SemiAutomaticWeapon {
  constructor() {
    super(600, 100, 500);
    this.type = WEAPON6;
    this.spriteWidth = 40;
    this.spriteHeight = 20;
  }
}

class DoublePistol extends SemiAutomaticWeapon {
  constructor() {
    super(300, 95, 400);
    this.type = WEAPON2;
    this.spriteWidth = 30;
    this.spriteHeight = 40;
  }

  apply(x, y, direction, bulletPhysics, shooter, player) {
    if (statusApply(player)) {
      return;
    }
    let time = new Date();
    if (!this.triggered && time - this.lastShot >= this.fireRate) {
      this.lastShot = time;
      let spread1 = (Math.random() - 0.5) * Math.PI * (100 - this.accuracy) / 100;
      let bullet1 = new Bullet(x + 20 * Math.cos(direction + Math.PI / 2) + 50 * Math.cos(direction), y + 20 * Math.sin(direction + Math.PI / 2) + 50 * Math.sin(direction), direction + spread1, this.damage, shooter);
      this.setBulletStats(bullet1);
      bulletPhysics.bullets.push(bullet1);
      let spread2 = (Math.random() - 0.5) * Math.PI * (100 - this.accuracy) / 100;
      let bullet2 = new Bullet(x - 20 * Math.cos(direction + Math.PI / 2) + 50 * Math.cos(direction), y - 20 * Math.sin(direction + Math.PI / 2) + 50 * Math.sin(direction), direction + spread2, this.damage, shooter);
      this.setBulletStats(bullet2);
      bulletPhysics.bullets.push(bullet2);
      this.triggered = 1;
    }
  }
}

class Rifle extends AutomaticWeapon {
  constructor() {
    super(400, 98, 150);
    this.type = WEAPON3;
    this.spriteWidth = 73;
    this.spriteHeight = 18;
  }

}

class Smg extends AutomaticWeapon {
  constructor() {
    super(100, 80, 50);
    this.type = WEAPON4;
    this.spriteWidth = 50;
    this.spriteHeight = 20;
  }
}

class Gatling extends AutomaticWeapon {
  constructor() {
    super(300, 70, 15);
    this.type = WEAPON5;
    this.spriteWidth = 90;
    this.spriteHeight = 33;
  }
}


class Entry {
  constructor(name, id, score) {
    this.name = name;
    this.id = id;
    this.score = score;
  }
}

class Leaderboard {
  constructor() {
    this.array = [];
  }

  addEntry(name, id, score) {
    this.array.push(new Entry(name, id, score));
    return this.sort();
  }

  addPoint(id) {
    for (let i = 0; i <= this.array.length; i++) {
      if (this.array[i]?.id == id) {
        this.array[i].score++;
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



function generateitemId(key) {
  return Math.random().toString(36).substr(2, 3) + key;
}

function statusApply(player) {
  if (player.status == INVINCIBILITY) {
    return true;
  }
  if (player.status == HIDDENBODY) {
    player.status = REALBODY;
  }
  return false;
}