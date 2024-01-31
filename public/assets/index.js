function Terrain(pathArg) {
    this.sprite = new PIXI.Sprite(PIXI.loader.resources[pathArg].texture);
}

let UPDATE_KEY = "0";
let SEND_LEADERBORD = "1";
let SEND_ITEM = "2";
let SEND_ITEM_CHANGED = "3";
let FETCH_REQ = "4";
let FETCH_RES = "5";
let INPUT_CONTROL = "6";
let LOGIN = "7";
let NEW_PLAYER_GREATE = "8";
let PLAYER_REMOVE = "11";
let SEND_MSG = '9'
let DEATH = "10";
let PLAY_OUT = "11";
let WATCHING = '12';

let HITBODY = "0";
let HITBRICK = "2";
let HITSHIELD = "1";

let INVINCIBILITY = 0;
let REALBODY = 1;
let HIDDENBODY = 2;

let ADDITEM = 0;
let DELLITEM = 1;

let ADDPLAYER = 0;
let DELLPLAYER = 1;

let PLAYER_CHANGE_EVENT = 1;
let ITEM_CHANGE_EVENT = 0;

let FETCH_PLAYERS = 0;
let FETCH_ITEMS = 1;
let FETCH_MAP = 2;


let ITEMS = {
    SHIELD: 0,
    WEAPON1: 1,
    WEAPON2: 2,
    WEAPON3: 3,
    WEAPON4: 4,
    WEAPON5: 5,
    WEAPON6: 6,
    HEALTH: 7,
    HMEDCINE: 8
}


function WebSocketController(url) {
    this.listens = {};
    this.socketUrl = url || `ws://${document.location.hostname}:54071`
    this.ws = new WebSocket(this.socketUrl);
    this.connected = false;
    this.disconnected = true;
    let self = this;
    this.ws.onopen = function () {
        console.log('Connected to the WebSocket server');
        self.connected = true;
        self.disconnected = false;
        loadinghidden();
        self.onready();
    };

    this.ws.onmessage = function (event) {
        let e = JSON.parse(event.data);
        self.listens[e[0]] && self.listens[e[0]](e[1]);
    };

    this.send = function (key, data) {
        self.ws.send(JSON.stringify([key, data]));
    };

    this.ws.onclose = function (event) {
        console.log('Disconnected from the WebSocket server');
        self.connected = false;
        self.disconnected = true;
        loadingshow();
    };

    this.onready = function () {
        let storage = localStorage.getItem("auth");
        if (storage) {
            let _user = JSON.parse(storage);
            socket.send(LOGIN, { token: _user.token });
        }
    }

    this.listen = function () {
        this.listens[LOGIN] = function (data) {
            if (data.success) {
                initGame();
                $("#login-page").hide();
                $("#chatbox").show();
                localStorage.setItem("auth", JSON.stringify({
                    token: data.token,
                }));
                toast(data.message);
            } else {
                toast(data.message);
                loadinghidden();
            }
        }

        this.listens['STATUS'] = function (msg) {
            toast(msg);
            $("#login-page").hide();
        }
    }
}

let socket = new WebSocketController();
socket.listen();

let itemInfos = {
    7: {
        sprite: "healthPack",
        w: 50,
        h: 50,
    },
    0: {
        sprite: "shield",
        w: 20,
        h: 60,
        distance: 20
    },
    8: {
        sprite: "hidden_medicine",
        w: 15,
        h: 35
    },
    1: {
        sprite: "pistol",
        w: 30,
        h: 18,
        distance: 10
    },
    6: {
        sprite: "revolver",
        w: 40,
        h: 20,
        distance: 10
    },
    2: {
        sprite: "doublePistols",
        w: 30,
        h: 48,
        distance: 10
    },
    3: {
        sprite: "rifle",
        w: 73,
        h: 18,
        distance: 10
    },
    4: {
        sprite: "smg",
        w: 50,
        h: 20,
        distance: 10
    },
    5: {
        sprite: "gatling",
        w: 90,
        h: 33,
        distance: 10
    }
};

let currentPlayer = new CurrentPlayer();
////////////////////////////////////////////////////////////////////////////////

let input = {
    m: false,
    mangle: Math.PI,
    direction: Math.PI,
    LMB: false,
}


let touchRPos = {
    s: false,
    t: false,
    sx: 0,
    sy: 0,
    mx: 0,
    my: 0
}
let touchLPos = {
    s: false,
    t: false,
    sx: 0,
    sy: 0,
    mx: 0,
    my: 0
}


let keys = []




function loadingshow() {
    $("#loding").show();
}

function loadinghidden() {
    $("#loding").hide();
}


function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

let mouseposition = { x: 0, y: 0 };

$(document).ready(function () {
    loadinghidden();
    $("#chatbox").hide();
    $("#main-page").hide();

    $("#loginBtn").click(function () {
        let userNick = document.getElementById("userName").value;
        let userPassW = document.getElementById("userPassW").value;
        if (userNick != "") {
            socket.send(LOGIN, { userNick, userPassW });
            loadingshow();
        } else {
            alert("please enter name")
        }
    })

    $(".inputchat").on("keypress", function (e) {
        if (e.keyCode == 13 && e.target.value.length > 0) {
            socket.send(SEND_MSG, e.target.value);
            e.target.value = "";
        }
    })

    window.onresize = resize;

    window.addEventListener('keydown', function (e) {
        keys = (keys || []);
        keys[e.keyCode] = (e.type == "keydown");
    });

    window.addEventListener('keyup', function (e) {
        keys[e.keyCode] = (e.type == "keydown");
    });

    window.addEventListener('touchstart', (event) => {
        let touch = null;
        for (let j = 0; j < event.touches.length; j++) {
            touch = event.touches[j];
            if (touch.clientX <= window.innerWidth / 2) {
                touchLPos.sx = touch.clientX;
                touchLPos.sy = touch.clientY;
                touchLPos.mx = touch.clientX;
                touchLPos.my = touch.clientY;
                touchLPos.s = true;
            } else {
                touchRPos.sx = touch.clientX;
                touchRPos.sy = touch.clientY;
                touchRPos.mx = touch.clientX;
                touchRPos.my = touch.clientY;
                touchRPos.s = true;
                touchRPos.t = true;
                input.LMB = true;
            }
        }
    });
    window.addEventListener('touchmove', (event) => {
        for (let k = 0; k < event.touches.length; k++) {
            let touch = event.touches[k];
            if (touch.clientX <= window.innerWidth / 2) {
                if (touchLPos.s) {
                    touchLPos.mx = touch.clientX;
                    touchLPos.my = touch.clientY;
                    touchLPos.t = true;
                    input.m = true;
                    input.mangle = getAngle(touchLPos.sx, touchLPos.sy, touchLPos.mx, touchLPos.my);
                }
            } else {
                if (touchRPos.s) {
                    touchRPos.mx = touch.clientX;
                    touchRPos.my = touch.clientY;
                    touchRPos.t = true;
                    input.direction = getAngle(touchRPos.sx, touchRPos.sy, touchRPos.mx, touchRPos.my);
                }
            }
        }
    });

    window.addEventListener('touchend',
        (event) => {
            let touch = null;
            if (event.changedTouches.length > 0) {
                for (let i = 0; i < event.changedTouches.length; i++) {
                    touch = event.changedTouches[i];
                    if (event.touches.length > 0) {
                        if (touch.clientX <= window.innerWidth / 2) {
                            input.m = false;
                            touchLPos.t = false;
                            touchLPos.s = false;
                        } else {
                            touchRPos.t = false;
                            touchRPos.s = false;
                            input.LMB = false;
                        }
                    } else if (event.touches.length == 0) {
                        if (touchLPos.t) {
                            input.m = false;
                            touchLPos.t = false;
                            touchLPos.s = false;
                        }

                        if (touchRPos.t) {
                            touchRPos.t = false;
                            touchRPos.s = false;
                            input.LMB = false;
                        }
                    }
                }
            }
        });

    window.addEventListener('mousedown', function () {
        input.LMB = true;
    });
    window.addEventListener('mouseup', function () {
        input.LMB = false;
    });
    window.addEventListener('mousemove', function (event) {
        mouseposition.x = event.x;
        mouseposition.y = event.y;
        input.direction = getAngle(window.innerWidth / 2, window.innerHeight / 2, event.x, event.y);
    });


    $("#wallet").click(function () {
        $("#wallet_modal").modal("show");
    });

    $("#ranking").click(function () {
        $("#ranking_modal").modal("show");
    })

    $("#music").click(function () {
        if (controller.settings.music) {
            controller.settings.music = false;
        } else {
            controller.settings.music = true;
        }
        $("#music").html(`<img src="./assets/img/music_${controller.settings.music ? 'o' : 'f'}.svg" alt="music_icon" width="50px" height="50px">`);
    })

    $("#audio").click(function () {
        if (controller.settings.audio) {
            controller.settings.audio = false;
        } else {
            controller.settings.audio = true;
        }
        $("#audio").html(`<img src="./assets/img/audio_${controller.settings.audio ? 'o' : 'f'}.svg" alt="audio_icon" width="50px" height="50px">`);
    })

    $("#setting").click(function () {
        console.log(3)
        $("#setting_modal").modal("show");
    })
})

function distance(x1, y1, x2, y2) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return distance;
}


function resize() {
    let scale = window.innerHeight / controller.height;
    if (window.innerHeight > window.innerWidth) {
        scale = window.innerWidth / controller.width;
    }
    app.renderer.resize(window.innerWidth, window.innerHeight);
    mainContainer.width = controller.width * scale;
    mainContainer.height = controller.height * scale;
    mainContainer.scale.set(scale);
    mainContainer.position.set((window.innerWidth - mainContainer.width) / 2, (window.innerHeight - mainContainer.height) / 2);
    containerMask.clear();
    containerMask.beginFill(0x000000);
    containerMask.drawRect(mainContainer.position.x, mainContainer.position.y, mainContainer.width, mainContainer.height);
    containerMask.endFill();
}

function toast(text) {
    Toastify({
        text: text,
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        onClick: function () { } // Callback after click
    }).showToast();
}



function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}