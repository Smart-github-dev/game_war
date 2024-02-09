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
    .add("grass", "assets/sprites/grass.png")
    .add("sand", "assets/sprites/sand.png")
    .add("edge", "assets/sprites/edge.png")
    .add("water", "assets/sprites/water.png")
    .add("lava", "assets/sprites/lava.png")
    .add("brick", "assets/sprites/brick.png")
    .add("floor", "assets/sprites/floor.png")
    .add("pistol", "assets/sprites/pistol.png")
    .add("revolver", "assets/sprites/revolver.png")
    .add("doublePistols", "assets/sprites/doublePistols.png")
    .add("rifle", "assets/sprites/rifle.png")
    .add("smg", "assets/sprites/smg.png")
    .add("gatling", "assets/sprites/gatling.png")
    .add("bullet", "assets/sprites/bullet.png")
    .add("healthPack", "assets/sprites/healthPack.png")
    .add("shield", 'assets/sprites/shield.png')
    .add("shieldhit", 'assets/sprites/shieldhit.png')
    .add("brickhit", 'assets/sprites/brickhit.png')
    .add("bodyhit", 'assets/sprites/bodyhit.png')
    .add("player", 'assets/sprites/player.json')
    .add("player2", 'assets/sprites/player2.json')
    .add("explosion1", 'assets/sprites/explosion.json')
    .add("hidden_medicine", 'assets/sprites/hidden_medicine.png')
    .add('scope', 'assets/sprites/scope.svg')
    .add('outb', 'assets/sprites/out.svg')
    .load(setup);

  PIXI.sound.add('weaponSh', 'assets/sounds/Weaponshoot.mp3');
  PIXI.sound.add('bgSound', 'assets/sounds/BackgroundMusic.mp3')


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
    progressBar.drawRect(progressX, 0, 600 * progress, 20);
    progressBar.endFill();
  });

  loader.onComplete.add(() => {
    app.stage.removeChild(progressBar);
    app.stage.removeChild(progressText);
  });
  document.body.appendChild(app.view);
}

function setup(resources) {
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

  const btn = new PIXI.Sprite(PIXI.loader.resources['outb'].texture);

  btn.width = 30;
  btn.height = 30;
  btn.anchor.set(0.5);
  btnOut.addChild(btn);
  controller.emitInput();
  controller.touchCtl = new TouchCtl();
  controller.listenToChat();
  controller.listenToUpdate();
  controller.listenToDeath();
  controller.listenToFetchRes();
  controller.listenLeaderboard();
  controller.listenToItemChange();
  controller.listenToPlayerEvent();
  controller.listenToJoined();
  controller.listenToRoomDatas();
  controller.fetchRooms();
  if (controller.settings.music) {
    PIXI.sound.play('bgSound');
  }
  app.ticker.add(delta => controller.update(delta));
  $("#main-page").show();

  app.stage.addChild(containerMask);
  app.stage.addChild(mainContainer);
  app.stage.addChild(ctlContainer);
}

function gameStart() {
  if (controller.settings.roomid == null) {
    toast("please join map")
    return;
  }

  let i = controller.rooms.findIndex(r => r.id == controller.settings.roomid);
  if (i == -1)
    return;
  controller.bsc = 0;
  controller.newPlayer();
  $("#main-page").hide(200);
  controller.status = "play";
  document.body.style.cursor = 'none';
  btnOut.visible = true;
}

function gameWatch() {
  if (controller.settings.roomid == null) {
    toast("please join map")
    return;
  }

  let i = controller.rooms.findIndex(r => r.id == controller.settings.roomid);
  if (i == -1)
    return;
  controller.bsc = 0;
  socket.send(WATCHING);
  $("#main-page").hide(200);
  controller.status = "watch";
  document.body.style.cursor = 'none';
  btnOut.visible = true;
}

function outPlay() {
  socket.send(PLAY_OUT);
}

const mapContainer = new PIXI.Container();
const itemContainer = new PIXI.Container();
const bulletContainer = new PIXI.Container();
const playerFContainer = new PIXI.Container();
const playerBContainer = new PIXI.Container();
const playerWContainer = new PIXI.Container();
const playerHContainer = new PIXI.Container();

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

mainContainer.addChild(playerFContainer);
mainContainer.addChild(playerBContainer);
mainContainer.addChild(playerWContainer);
mainContainer.addChild(playerHContainer);

mainContainer.addChild(effectContainer);



// Create a button
const btnOut = new PIXI.Container();
btnOut.interactive = true;
btnOut.buttonMode = true;
btnOut.position.set(50, 50);
btnOut.visible = false;
// Add the button to the stage
app.stage.addChild(btnOut);

// Add event listeners
btnOut.on('pointerdown', () => {
  btnOut.visible = false;
  outPlay();
});


const showRoom = () => {
  $("#rooms").html(controller.rooms.map(r => {
    return `<button class="col-sm-4 m-1 btn border ${r.id == controller.settings.roomid ? 'border-primary bg-info' : ''}" onclick='selectRoom("${r.id}")' >
      <div class="card room-card  ">
        <div class="card-body text-warning d-flex justify-content-center align-items-center" >
          ${r.name} : ${r.count}  
          <span class="rounded-circle bg-success mx-1" style="width:15px;height:15px;display:flex" ></span>
        </div>
      </div>
    </button>`;
  }).concat(`<button class="col-sm-4 m-1 btn border" onclick='createRoom()' >
  <div class="card room-card  ">
    <div class="card-body text-warning d-flex justify-content-center align-items-center" >
      <img src="./assets/img/create.svg" width="30px" height="30px" alt="create">
    </div>
  </div>
</button>`));
}


const selectRoom = (id) => {
  controller.joinRequest(id)
}

const createRoom = () => {
  toast("It's not working yet")
}