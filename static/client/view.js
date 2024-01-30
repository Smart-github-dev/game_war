'use strict';
let type = "WebGL"
if (!PIXI.utils.isWebGLSupported()) {
  type = "canvas"
}


let bulletinfokey = {
  x: 0,
  y: 1,
  direction: 2
}


let scale = 1;

let app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  // backgroundColor: 0x1099bb, // Background color in hexadecimal
  antialias: true,
  transparent: true,
  // autoDensity: true,
  resolution: 1, // handle high-resolution displays
});



let explosionFrames = {};
var playerAnimationframes = {};



function initGame() {
  const loader = PIXI.loader;
  loader
    .add("grass", "client/sprites/grass.png")
    .add("sand", "client/sprites/sand.png")
    .add("edge", "client/sprites/edge.png")
    .add("water", "client/sprites/water.png")
    .add("lava", "client/sprites/lava.png")
    .add("brick", "client/sprites/brick.png")
    .add("floor", "client/sprites/floor.png")
    .add("pistol", "client/sprites/pistol.png")
    .add("revolver", "client/sprites/revolver.png")
    .add("doublePistols", "client/sprites/doublePistols.png")
    .add("rifle", "client/sprites/rifle.png")
    .add("smg", "client/sprites/smg.png")
    .add("gatling", "client/sprites/gatling.png")
    .add("bullet", "client/sprites/bullet.png")
    .add("healthPack", "client/sprites/healthPack.png")
    .add("shield", 'client/sprites/shield.png')
    .add("shieldhit", 'client/sprites/shieldhit.png')
    .add("brickhit", 'client/sprites/brickhit.png')
    .add("bodyhit", 'client/sprites/bodyhit.png')
    .add("player", 'client/sprites/player.json')
    .add("player2", 'client/sprites/player2.json')
    .add("explosion1", 'client/sprites/explosion.json')
    .add("hidden_medicine", 'client/sprites/hidden_medicine.png')
    .add('scope', 'client/sprites/scope.svg')
    .load(setup);

  let progressBar = new PIXI.Graphics();
  progressBar.x = 100;
  progressBar.y = 200;

  let progressX = (app.renderer.view.width / 2) - 400;

  app.stage.addChild(progressBar);

  let progressText = new PIXI.Text(`loading ${loader.progress}%`);

  progressText.style = { fontSize: 20, fill: 'white', stroke: 'black', strokeThickness: 3 };
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
  });
  document.body.appendChild(app.view);
}

function setup() {
  let textures = PIXI.loader.resources["explosion1"].textures;
  explosionFrames['explosion1'] = [];
  for (var i in textures) {
    explosionFrames['explosion1'].push(textures[i]);
  }

  textures = PIXI.loader.resources['player'].textures;
  playerAnimationframes['player'] = [];
  for (var i in textures) {
    playerAnimationframes['player'].push(textures[i]);
  }

  textures = PIXI.loader.resources['player2'].textures;
  playerAnimationframes['player2'] = [];
  for (var i in textures) {
    playerAnimationframes['player2'].push(textures[i]);
  }

  controller.fetchData(function () {
    loadinghidden();
    $("#main-page").show();
    controller.emitInput();
    app.ticker.add(delta => controller.update(delta));
  });

  controller.touchCtl = new TouchCtl();
  controller.listenToChat();
  controller.listenToUpdate();
  controller.listenToDeath();
  controller.listenToFetchRes();
  controller.listenLeaderboard();
  controller.listenToItemChange();
  controller.listenToPlayerEvent();
}

function gameStart() {
  controller.bsc = 0;
  controller.newPlayer();
  $("#main-page").hide();
  controller.status = "play";
  document.body.style.cursor = 'none';
}

function gameWatch() {
  controller.bsc = 0;
  socket.send(WATCHING);
  $("#main-page").hide();
  document.body.style.cursor = 'none';
}

function outPlay() {
  socket.send(PLAY_OUT);
}

const mapContainer = new PIXI.Container();
const itemContainer = new PIXI.Container();
const bulletContainer = new PIXI.Container();
const playerContainer = new PIXI.Container();
const effectContainer = new PIXI.Container();
const trailContainer = new PIXI.Container();

const ctlContainer = new PIXI.Container();
const mainContainer = new PIXI.Container();
const containerMask = new PIXI.Graphics();
mainContainer.mask = containerMask;

mainContainer.addChild(mapContainer);
mainContainer.addChild(itemContainer);
mainContainer.addChild(bulletContainer);
mainContainer.addChild(trailContainer);

mainContainer.addChild(playerContainer);
mainContainer.addChild(effectContainer);
app.stage.addChild(containerMask);
app.stage.addChild(mainContainer);
app.stage.addChild(ctlContainer);


