function Terrain(pathArg) {
    this.path = pathArg;
}
let user = {};


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
        self.listens[e.key] && self.listens[e.key](e.data);
    };

    this.send = function (key, data) {
        self.ws.send(JSON.stringify({ key, data }));
    };

    this.ws.onclose = function (event) {
        console.log('Disconnected from the WebSocket server');
        self.connected = false;
        self.disconnected = true;
        loadingshow();
    };

    this.onready = function () {
        let storage = localStorage.getItem("user-info");
        if (storage) {
            let _user = JSON.parse(storage);
            if (((Date.now() - _user.time) / 1000) / 60 < 30) { //expire time 30min
                user = { userNick: _user.userNick.toLocaleUpperCase(), userPassW: _user.userPassW.toLocaleUpperCase() };
                socket.send("login", { userNick: _user.userNick, userPassW: _user.userPassW });
            } else {
                localStorage.removeItem("user-info")
            }
        }
    }
}

let socket = new WebSocketController();

let gameMap = new GameMap();
let players = [];
let bullets = [];
var items = [];
var leaderboard = [];

let camera = {
    x: 0,
    y: 0
}

let itemInfos = {
    "health": {
        sprite: "healthPack.png",
        w: 50,
        h: 50
    },
    "weapon1": {
        sprite: "pistol.png",
        w: 30,
        h: 18
    },
    "weapon6": {
        sprite: "revolver.png",
        w: 40,
        h: 20
    },
    "weapon2": {
        sprite: "doublePistols.png",
        w: 30,
        h: 48
    },
    "weapon3": {
        sprite: "rifle.png",
        w: 73,
        h: 18
    },
    "weapon4": {
        sprite: "smg.png",
        w: 50,
        h: 20
    },
    "weapon5": {
        sprite: "gatling.png",
        w: 90,
        h: 33
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
    t: false,
    sx: 0,
    sy: 0,
    mx: 0,
    my: 0
}
let touchLPos = {
    t: false,
    sx: 0,
    sy: 0,
    mx: 0,
    my: 0
}

window.addEventListener(
    "touchstart",
    (event) => {
        event.preventDefault();
        let touchOne = null;
        let touchTwo = null;
        if (event.touches.length >= 2) {
            touchTwo = event.touches[1];
            if (touchTwo.clientX <= window.innerWidth / 2) {
                touchLPos.sx = touchTwo.clientX;
                touchLPos.sy = touchTwo.clientY;
                touchLPos.mx = touchTwo.clientX;
                touchLPos.my = touchTwo.clientY;
                input.m = true;
                touchLPos.t = true;
            } else {
                touchRPos.sx = touchTwo.clientX;
                touchRPos.sy = touchTwo.clientY;
                touchRPos.mx = touchTwo.clientX;
                touchRPos.my = touchTwo.clientY;
                touchRPos.t = true;
            }
        } else {
            touchOne = event.touches[0];
            if (touchOne.clientX <= window.innerWidth / 2) {
                touchLPos.sx = touchOne.clientX;
                touchLPos.sy = touchOne.clientY;
                touchLPos.mx = touchOne.clientX;
                touchLPos.my = touchOne.clientY;
                input.m = true;
                touchLPos.t = true;
            } else {
                touchRPos.sx = touchOne.clientX;
                touchRPos.sy = touchOne.clientY;
                touchRPos.mx = touchOne.clientX;
                touchRPos.my = touchOne.clientY;
                touchRPos.t = true;
            }
        }
    },
    { passive: false }
);

window.addEventListener(
    "touchmove",
    (event) => {
        event.preventDefault();
        let touchOne = null;
        let touchTwo = null;
        if (event.touches.length >= 2) {
            touchOne = event.touches[0];
            touchTwo = event.touches[1];
            if (touchOne.clientX <= window.innerWidth / 2) {
                touchLPos.mx = touchOne.clientX;
                touchLPos.my = touchOne.clientY;
                input.direction = getAngle(touchLPos.sx, touchLPos.sy, touchLPos.mx, touchLPos.my);
                // input.mangle = input.direction;
                touchLPos.t = true;
            }
            if (touchOne.clientX > window.innerWidth / 2) {
                touchRPos.mx = touchOne.clientX;
                touchRPos.my = touchOne.clientY;
                touchRPos.t = true;
                input.LMB = true;

                input.mangle = getAngle(touchRPos.sx, touchRPos.sy, touchRPos.mx, touchRPos.my);
            }
            if (touchTwo) {
                if (touchTwo.clientX <= window.innerWidth / 2) {
                    touchLPos.mx = touchTwo.clientX;
                    touchLPos.my = touchTwo.clientY;
                    touchLPos.t = true;
                    input.direction = getAngle(touchLPos.sx, touchLPos.sy, touchLPos.mx, touchLPos.my);
                    // input.mangle = input.direction;
                }
                if (touchTwo.clientX > window.innerWidth / 2) {
                    touchRPos.t = true;
                    touchRPos.mx = touchTwo.clientX;
                    touchRPos.my = touchTwo.clientY;
                    input.LMB = true;

                    input.mangle = getAngle(touchRPos.sx, touchRPos.sy, touchRPos.mx, touchRPos.my);
                }
            }
        } else {
            touchOne = event.changedTouches[0];
            if (touchOne.clientX <= window.innerWidth / 2) {
                touchLPos.mx = touchOne.clientX;
                touchLPos.my = touchOne.clientY;
                touchLPos.t = true;
                input.direction = getAngle(touchLPos.sx, touchLPos.sy, touchLPos.mx, touchLPos.my);
                // input.mangle = input.direction;

            } else {
                touchRPos.mx = touchOne.clientX;
                touchRPos.my = touchOne.clientY;
                touchRPos.t = true;
                input.LMB = true;
                input.mangle = getAngle(touchRPos.sx, touchRPos.sy, touchRPos.mx, touchRPos.my);
            }
        }
    },
    { passive: false }
);

window.addEventListener(
    "touchend",
    (event) => {
        event.preventDefault();
        let touch = null;
        if (event.touches.length > 0) {
            touch = event.touches[0];
            if (touch.clientX <= window.innerWidth / 2) {
                input.m = false;
                touchLPos.t = true;
            } else {
                touchRPos.t = true;
                input.LMB = false;
            }
        } else {

        }
    },
    { passive: false }
);

window.addEventListener(
    "dbclick",
    (event) => {
        event.preventDefault();
    },
    { passive: false }
);

let keys = []

window.addEventListener('keydown', function (e) {
    keys = (keys || []);
    keys[e.keyCode] = (e.type == "keydown");
});

window.addEventListener('keyup', function (e) {
    keys[e.keyCode] = (e.type == "keydown");
});


document.addEventListener('mousemove', function (event) {
    let arg = (event.y - window.innerHeight / 2) / (event.x - window.innerWidth / 2);
    if (event.x >= window.innerWidth / 2)
        currentPlayer.direction = Math.atan(arg);
    else
        currentPlayer.direction = Math.PI - Math.atan((-1) * arg);
    input.direction = currentPlayer.direction;
}
);

document.addEventListener("mousedown", function () {
    input.LMB = true;
});

document.addEventListener("mouseup", function () {
    input.LMB = false;
});

window.onresize = resize;



function loadingshow() {
    document.getElementById("loding").style = "display:block";
}

function loadinghidden() {
    document.getElementById("loding").style = "display:none";
}

loadinghidden();
$("#chatbox").hide();
$("#main-page").hide();

function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}



$(document).ready(function () {
        console.log(2);

    $("#loginBtn").click(function () {
        let userNick = document.getElementById("userName").value;
        let userPassW = document.getElementById("userPassW").value;
        if (userNick != "") {
            socket.send("login", { userNick, userPassW });
            loadingshow();
            user = { userNick: userNick.toLocaleUpperCase(), userPassW: userPassW.toLocaleUpperCase() };
        } else {
            alert("please enter name")
        }
    })


    $(".inputchat").on("keypress", function (e) {
        if (e.keyCode == 13) {
            socket.send("msg", e.target.value);
            e.target.value = "";
        }
    })


    socket.listens["login"] = function (data) {
        if (data.success) {
            initGame();
            $("#login-page").hide();
            $("#chatbox").show();
            localStorage.setItem("user-info", JSON.stringify({
                userNick: user.userNick.toLocaleUpperCase(),
                userPassW: user.userPassW.toLocaleUpperCase(),
                time: Date.now()
            }));

        } else {
            alert(data.message);
            loadinghidden();
        }
    }

})



