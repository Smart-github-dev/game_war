'use strict';
let type = "WebGL"
if (!PIXI.utils.isWebGLSupported()) {
  type = "canvas"
}


let playerinfokey = {
  x: 0,
  y: 1,
  direction: 2,
  name: 3,
  itemType: 4,
  size: 5,
  health: 6
}


let bulletinfokey = {
  x: 0,
  y: 1,
  direction: 2
}


let scale = 1;

let app = new PIXI.Application({
  width: controller.width * scale,
  height: controller.height * scale,
  antialias: true,
  transparent: false,
  resolution: 1
});


let center = {
  offx: controller.width / 2,
  offy: controller.height / 2
}


function initGame() {
  const loader = PIXI.loader;

  loader
    .add("client/sprites/grass.png")
    .add("client/sprites/sand.png")
    .add("client/sprites/edge.png")
    .add("client/sprites/water.png")
    .add("client/sprites/lava.png")
    .add("client/sprites/brick.png")
    .add("client/sprites/floor.png")
    .add("client/sprites/player.png")
    .add("client/sprites/pistol.png")
    .add("client/sprites/revolver.png")
    .add("client/sprites/doublePistols.png")
    .add("client/sprites/rifle.png")
    .add("client/sprites/smg.png")
    .add("client/sprites/gatling.png")
    .add("client/sprites/bullet.png")
    .add("client/sprites/healthPack.png")
    .add("client/sprites/player2.png")
    .add("client/sprites/player3.png")
    .add("client/sprites/player4.png")
    .load(setup);

  let progressBar = new PIXI.Graphics();
  progressBar.x = 100;
  progressBar.y = 200;

  let progressX = (app.renderer.view.width / 2) - 200;

  app.stage.addChild(progressBar);

  let progressText = new PIXI.Text(`loading ${loader.progress}%`, {
    fontSize: 20,
  });

  progressText.style = { fill: 'white', stroke: 'black', strokeThickness: 3 };
  progressText.anchor.set(0.5, 0.5);
  progressText.position.set(progressX + 200, 0 - 55);
  app.stage.addChild(progressText);

  loader.onProgress.add((loader, resource) => {
    let progress = loader.progress / 100;
    progressBar.clear();
    progressBar.beginFill(0x0099ff, 1);
    progressBar.drawRect(progressX, 0, 400 * progress, 20);
    progressBar.endFill();
  });

  loader.onComplete.add(() => {
    app.stage.removeChild(progressBar);
    app.stage.removeChild(progressText);

    setup();
  });

  resize();
  document.body.appendChild(app.view);
}

function setup() {
  controller.fetchData(function () {
    loadinghidden();
    $("#main-page").show();
    controller.emitInput();
    app.ticker.add(delta => gameLoop(delta));
  });
  controller.listenToChat();
  controller.listenToUpdate();
  controller.listenToDeath();
  controller.listenToFetchRes();
  controller.listenLeaderboard();
  controller.listenToItemChange();
}


function gameStart() {
  controller.newPlayer();
  $("#main-page").hide();
}

function gameLoop(delta) {
  app.stage.removeChildren();

  if (controller.mode == 'dead') {
    controller.mode = "";
    $("#main-page").show();
  }

  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 21; j++) {
      let square = new PIXI.Sprite(PIXI.loader.resources[gameMap.square[Math.min(Math.max(Math.floor(camera.y / controller.squareWidthInPixels) - 7 + i, 0), 99)]
      [Math.min(Math.max(Math.floor(camera.x / controller.squareHeightInPixels) - 10 + j, 0), 99)].path].texture);
      square.x = controller.squareWidthInPixels * j - camera.x % controller.squareWidthInPixels;
      square.y = controller.squareHeightInPixels * i - camera.y % controller.squareHeightInPixels;
      app.stage.addChild(square);
    }
  }


  gameObjectDraw();

  leaderBoardDraw();

  smallMapDraw();

  touchControllDraw();
}


function smallMapDraw() {
  let miniMap = new PIXI.Graphics();
  miniMap.lineStyle(.5, 0x3399ff, .9);
  miniMap.beginFill('black', 0.3);
  miniMap.drawRect(880, 580, 100, 100);
  miniMap.endFill();
  app.stage.addChild(miniMap);

  for (let p = 0; p < players.length; p++) {
    let player = players[p];
    let pointPlayer = new PIXI.Graphics();
    if (player[playerinfokey.x] == 500 && player[playerinfokey.y] == 400)
      pointPlayer.beginFill(0x008111);
    else
      pointPlayer.beginFill(0xFF0000);
    pointPlayer.drawCircle(880 + player[playerinfokey.x] / 5000 * 100, 580 + player[playerinfokey.y] / 5000 * 100, 3);
    pointPlayer.endFill();
    app.stage.addChild(pointPlayer);
  }
}


function leaderBoardDraw() {
  let leaderboardBackground = new PIXI.Graphics();
  leaderboardBackground.lineStyle(.5, 0x0073e6, 0.7);
  leaderboardBackground.beginFill('black', 0.3);
  leaderboardBackground.drawRoundedRect(790, 10, 200, 200, 10);
  leaderboardBackground.endFill();
  app.stage.addChild(leaderboardBackground);

  let leaderboardVerticalLine = new PIXI.Graphics();

  leaderboardVerticalLine.beginFill(0x0073e6, 0.7);
  leaderboardVerticalLine.drawRect(930, 20, 2, 180);
  leaderboardVerticalLine.endFill();
  app.stage.addChild(leaderboardVerticalLine);

  let leaderboardHorizontalLine = new PIXI.Graphics();

  leaderboardHorizontalLine.beginFill(0x0073e6, 0.7);
  leaderboardHorizontalLine.drawRect(800, 40, 180, 2);
  leaderboardHorizontalLine.endFill();
  app.stage.addChild(leaderboardHorizontalLine);

  let leaderboardTitle = new PIXI.Text("NICK              KILLS");
  leaderboardTitle.style = { fill: 'white', strokeThickness: 0, fontSize: 15 };
  leaderboardTitle.position.set(850, 20);
  app.stage.addChild(leaderboardTitle);

  for (let i = 0; i < leaderboard.length; i++) {
    let entryName = new PIXI.Text(i + 1 + ". " + leaderboard[i].name);
    entryName.anchor.set(0.5, 0.5);
    entryName.style = { fill: 'white', strokeThickness: 0, fontSize: 15 };
    entryName.position.set(860, 55 + i * 20);
    app.stage.addChild(entryName);

    let entryKills = new PIXI.Text(leaderboard[i].score);
    entryKills.anchor.set(0.5, 0.5);
    entryKills.style = { fill: 'white', strokeThickness: 0, fontSize: 15 };
    entryKills.position.set(960, 55 + i * 20);
    app.stage.addChild(entryKills);

    if (i >= 7)
      break;
  }
}



function gameObjectDraw() {
  let offx = camera.x - center.offx;
  let offy = camera.y - center.offy;


  let _items = items.filter(item => distance(item.x, item.y, camera.x, camera.y) < controller.width / 2);
  for (let i = 0; i < _items.length; i++) {
    let iteminfo = itemInfos[_items[i].type];
    let itemSprite = new PIXI.Sprite(PIXI.loader.resources['client/sprites/' + iteminfo.sprite].texture);
    itemSprite.anchor.set(0.5, 0.5);
    itemSprite.width = iteminfo.w;
    itemSprite.height = iteminfo.h;
    itemSprite.x = _items[i].x - offx;
    itemSprite.y = _items[i].y - offy;
    itemSprite.rotation = _items[i].direction;
    app.stage.addChild(itemSprite);
  }


  for (let i = 0; i < players.length; i++) {
    let player = players[i];
    let x = player[playerinfokey.x] - offx;
    let y = player[playerinfokey.y] - offy;

    let playerBorder = new PIXI.Graphics();
    let playerSprite;

    if (player[playerinfokey.name] == user.userNick) {
      playerBorder.beginFill(0x0099ff, .3);
      playerSprite = new PIXI.Sprite(PIXI.loader.resources['client/sprites/player4.png'].texture);
    } else {
      playerBorder.beginFill(0xff9900, .3);
      playerSprite = new PIXI.Sprite(PIXI.loader.resources['client/sprites/player3.png'].texture);
    }

    playerBorder.drawCircle(x, y, player[playerinfokey.size]);
    playerBorder.endFill();
    app.stage.addChild(playerBorder);

    playerSprite.anchor.set(0.5, 0.5);
    playerSprite.width = player[playerinfokey.size] * 2;
    playerSprite.height = player[playerinfokey.size] * 2;
    playerSprite.rotation = player[playerinfokey.direction];
    playerSprite.position.set(x, y);
    app.stage.addChild(playerSprite);


    let weaponSprite = new PIXI.Sprite(PIXI.loader.resources['client/sprites/' + itemInfos[player[playerinfokey.itemType]].sprite].texture);
    weaponSprite.anchor.set(0.5, 0.5);
    weaponSprite.rotation = player[playerinfokey.direction];
    weaponSprite.width = itemInfos[player[playerinfokey.itemType]].w;
    weaponSprite.height = itemInfos[player[playerinfokey.itemType]].h;
    weaponSprite.x = x + 10 * Math.cos(player[playerinfokey.direction]);
    weaponSprite.y = y + 10 * Math.sin(player[playerinfokey.direction]);
    app.stage.addChild(weaponSprite);

    let name = new PIXI.Text(player[playerinfokey.name], {
      fontSize: 10, // Set the font size to 24
    });
    name.style = { fill: 'white', stroke: 'black', strokeThickness: 1 };
    name.anchor.set(0.5, 0.5);
    name.position.set(x, y - 55);
    app.stage.addChild(name);

    let redBar = new PIXI.Graphics();
    redBar.beginFill(0xFF0000, 1);
    redBar.drawRect(x - 40, y - 40, 80, 10);
    redBar.endFill();
    app.stage.addChild(redBar);

    let greenBar = new PIXI.Graphics();
    if (player[playerinfokey.name] == user.userNick) {
      greenBar.beginFill(0xffff00, .5);
    } else {
      greenBar.beginFill(0x0099cc, .5);
    }
    greenBar.drawRect(x - 40, y - 40, Math.max(0, player[playerinfokey.health] * (80 / 1000)), 10);
    greenBar.endFill();
    app.stage.addChild(greenBar);
  }


  let length = bullets.length;
  for (let i = 0; i < length; i++) {
    let bulletSprite = new PIXI.Sprite(PIXI.loader.resources['client/sprites/bullet.png'].texture);
    bulletSprite.anchor.set(0.5, 0.5);
    bulletSprite.x = bullets[i][bulletinfokey.x] - offx;
    bulletSprite.y = bullets[i][bulletinfokey.y] - offy;
    bulletSprite.rotation = bullets[i][bulletinfokey.direction];
    app.stage.addChild(bulletSprite);
  }
}


function touchControllDraw() {
  let graphics = new PIXI.Graphics();

  if (touchLPos.t) {
    graphics.beginFill(0x00FF00, .2);
    graphics.drawCircle(touchLPos.sx, touchLPos.sy, 150);
    graphics.endFill();
    graphics.beginFill(0x00FF00, .4);
    graphics.drawCircle(touchLPos.mx, touchLPos.my, 20);
    graphics.endFill();
  }
  if (touchRPos.t) {
    graphics.beginFill(0x00FF00, .2);
    graphics.drawCircle(touchRPos.sx, touchRPos.sy, 150);
    graphics.endFill();
    graphics.beginFill(0x00FF00, .4);
    graphics.drawCircle(touchRPos.mx, touchRPos.my, 20);
    graphics.endFill();
  }

  app.stage.addChild(graphics);


  if (!touchLPos.t && !touchRPos.t) {
    let direction = {
      x: 0,
      y: 0
    }
    input.m = false;

    if (keys && keys[87]) { direction.x = -1; input.m = true }
    if (keys && keys[83]) { direction.x = 1; input.m = true }
    if (keys && keys[65]) { direction.y = -1; input.m = true }
    if (keys && keys[68]) { direction.y = 1; input.m = true }

    if (input.m) {
      input.mangle = getAngle(0, 0, direction.x, direction.y);
    }
  }
}

function distance(x1, y1, x2, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  return distance;
}


function resize() {
  scale = window.innerHeight < window.innerWidth ? (window.innerHeight - 20) / controller.height : (window.innerWidth - 20) / controller.height;
  app.renderer.resize(controller.width * scale, controller.height * scale);
  app.stage.scale.set(scale);
}


function distance(x1, y1, x2, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  return distance;
}

