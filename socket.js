
const Model = require('./componets.js');
const PlayerModel = require("./model/player.model.js");
const HistoryModel = require("./model/history.model.js");

const {
    SEND_ITEM_CHANGED,
    UPDATE_KEY,
    SEND_MSG,
    INPUT_CONTROL,
    NEW_PLAYER_GREATE,
    FETCH_REQ,
    FETCH_RES,
    LOGIN,
    SEND_LEADERBORD,
    DEATH,
    PLAYER_REMOVE,
    INVINCIBILITY,
    REALBODY,
    HIDDENBODY,
    FETCH_PLAYERS,
    FETCH_ITEMS,
    FETCH_MAP,
    WATCHING,
    PLAY_OUT,
    ROOMS,
    JOIN_ROOM
} = require('./types.js');

const {
    generateJWT,
    distance,
    getAngle,
    rotatetoTraget,
    verifyJWT,
    getHas,
    generateitemId
} = require('./utills.js');

const ips = [];
const GROOMS = [];


module.exports = (wss) => {
    wss.on('connection', function (ws) {
        const clientAddress = ws._socket.remoteAddress;
        const clientPort = ws._socket.remotePort;
        const clientInfo = ws._socket.address();
        console.log('Client connected from ' + clientAddress + ':' + clientPort);
        console.log('Client info:', clientInfo);
        let i = ips.findIndex((ipAddress) => ipAddress == clientAddress);
        if (i == -1) {
            ips.push(clientAddress);
            new PlayerSocket(ws, clientAddress);
        } else {
            ws.send(JSON.stringify(['STATUS', "You are now attempting dual access.Please don't do it."]))
        }

        ws.on("close", function () {
            let i = ips.findIndex((ipAddress) => ipAddress == clientAddress);
            if (i != -1) {
                ips.splice(i, 1);
            }
        })
    });

    GROOMS.push(new GameEngine());
    GROOMS.push(new GameEngine());
};

const PlayerSocket = function (ws) {
    this.id = generateitemId();
    this.player = null;
    this.name = null;
    this.ready = false;
    this.x = (Math.random() * 500);
    this.y = (Math.random() * 500);
    let self = this;
    this.eyesight = 500;
    this.watch = false;
    this.dbid = null;
    this.roomid = null;

    ws.on('message', async function (message) {
        const msgdata = JSON.parse(message);
        let key = msgdata[0];
        let data = msgdata[1];
        switch (key) {
            case LOGIN:
                self.login(data);
                break;
            case ROOMS:
                if (self.ready)
                    self.send(ROOMS, GROOMS.map(room => {
                        return {
                            id: room.id,
                            name: room.name,
                            count: room.users.length
                        }
                    }));
                break;
            case JOIN_ROOM:
                if (self.roomid != data) {
                    let i = GROOMS.findIndex(room => room.id == data);
                    if (i != -1) {
                        if (self.roomid != null) {
                            let j = GROOMS.findIndex(room => room.id == self.roomid);
                            if (j != -1) {
                                GROOMS[j].out(self);
                            }
                        }
                        GROOMS[i].join(self);
                        self.roomid = data;
                        self.send(JOIN_ROOM, data);
                    }
                }
                break;
            case FETCH_REQ:
                let j = GROOMS.findIndex(room => room.id == self.roomid);
                if (j != -1) {
                    switch (data) {
                        case FETCH_MAP:
                            self.send(FETCH_RES, {
                                key: FETCH_MAP,
                                data: GROOMS[j].model.getMap().square.map(row => row.map(c => c.type))
                            });
                            break;
                        case FETCH_ITEMS:
                            self.send(FETCH_RES, {
                                key: FETCH_ITEMS,
                                data: GROOMS[j].model.getItems().array.map(item => ({
                                    id: item.id,
                                    type: item.type,
                                    x: item.x,
                                    y: item.y
                                }))
                            })
                            break;
                        case FETCH_PLAYERS:
                            self.send(FETCH_RES, {
                                key: FETCH_PLAYERS,
                                data: GROOMS[j].users.filter(p => p.player != null).map(p => {
                                    return {
                                        id: p.id,
                                        name: p.player.name
                                    }
                                })
                            })
                            break;
                    }
                }
                break;
            case NEW_PLAYER_GREATE:
                if (self.player != null)
                    return;
                let i = GROOMS.findIndex(room => room.id == self.roomid);
                if (i != -1) {
                    GROOMS[i].playerOpen(self);
                }
                break;
            case WATCHING:
                self.watch = true;
                break;
            case PLAY_OUT:
                if (self.watch) {
                    self.watch = false;
                    self.send(DEATH);
                } else if (self.player) {
                    let i = GROOMS.findIndex(room => room.id == self.roomid);
                    if (i != -1) {
                        GROOMS[i].model.leaderboard.remove(self.player.id);
                        GROOMS[i].sendPlayerEvent(PLAYER_REMOVE, {
                            id: self.id
                        });
                        self.send(DEATH);
                        self.player = null;
                    }
                }
                break;
            case INPUT_CONTROL:
                let player = self.player;
                if (player == null)
                    return;
                let l = GROOMS.findIndex(room => room.id == self.roomid);
                if (l == -1)
                    return;
                GROOMS[l].plyaerControl(player, data);
                break;
            case SEND_MSG:
                let a = GROOMS.findIndex(room => room.id == self.roomid);
                if (a == -1) return;
                GROOMS[a].sendMsg([self.name, data]);

                break;
            case "NETSPEED":
                let history = new HistoryModel({
                    name: self.name,
                    type: "bad_history",
                    data: data,
                    createdAt: Date.now()
                })
                await history.save();
                this.ready = false;
                break;
        }
    });

    ws.on("close", function () {
        let l = GROOMS.findIndex(room => room.id == self.roomid);
        if (l == -1)
            return;
        GROOMS[l].playerClose(self);
        self.player = null;
        delete self;
    });

    this.login = async (data) => {

        const logined = async (player) => {
            if (player.status == "block") {
                self.send(LOGIN, { success: false, message: `You're blocked and can't play. Contact our support team.` });
                return;
            }
            player.updatedAt = Date.now();
            await player.save();
            let token = generateJWT(player);
            self.dbid = player._id;
            self.name = player.name;
            self.send(LOGIN, { success: true, token, message: "You are Welcome" });
            self.ready = true;
        }

        if (typeof data.token == "string") {
            verifyJWT(data.token, async (decoded) => {
                await PlayerModel.findByIdAndUpdate(decoded.id, { updatedAt: Date.now() });
                let player = await PlayerModel.findById(decoded.id);
                if (!player) {
                    self.send(LOGIN, { success: false, message: `Welcome , Please login` });
                    return;
                }
                logined(player)
            }, () => {
                return;
            })
        } else if (typeof data.userNick == 'string' && data.userNick.length > 2 && data.userNick.length < 20) {
            if (data.userNick.includes(' ')) {
                self.send(LOGIN, { success: false, message: `Please remove spaces in nickname` });
            }
            let username = data.userNick.toLocaleLowerCase();
            let password = data.userPassW.toLocaleLowerCase();
            if (password.length < 3) {
                self.send(LOGIN, { success: false, message: `Hi ${username},Your password must be at least 3 characters long` });
                return;
            }
            let player = await PlayerModel.findOne({ name: username });
            if (!player || !player.password) {
                let hasPass = getHas(password);
                if (!player) {
                    let player = new PlayerModel({
                        name: username,
                        password: hasPass,
                        discordId: 'false',
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    });
                    await player.save();
                    self.send(LOGIN, { success: false, message: `Hi ${username},You are newly registered. The default password is ${password}. Please log in again.` });
                } else {
                    player.password = hasPass;
                    await player.save();
                    self.send(LOGIN, { success: false, message: `Hi ${username},You are newly registered. The default password is ${password}. Please log in again.` });
                }
                return;
            } else {
                const isPasswordCorrect = await player.checkPassword(password);
                if (!isPasswordCorrect) {
                    self.send(LOGIN, { success: false, message: "Password verification failed" });
                    return;
                }
            }

            logined(player);

        } else {
            if (data.userNick.length >= 10) {
                self.send(LOGIN, { success: false, message: "Hello, my nickname is too long. Please shorten it." })
                return;
            }
            self.send(LOGIN, { success: false, message: "You must enter 3+ characters " });
        }
    }

    this.send = (key, data) => {
        // let d = JSON.stringify([key, data]);
        // netlength = d.length;
        ws.send(JSON.stringify([key, data]));
    }
}

const BotAI = function (id, roomid) {
    this.id = id;
    this.name = id;
    this.player = null;
    this.eyesight = 400;
    this.direction = 0;
    this.bot = true;
    this.target = false;
    this.ready = false;
    this.eventTime = 0;
    this.watch = false;
    this.roomid = null;
    let self = this;
    this._init = function (roomid) {
        if (this.player != null)
            return;
        this.roomid = roomid;
        let i = GROOMS.findIndex(room => room.id == this.roomid);
        if (i == -1) return;
        GROOMS[i].playerOpen(self);
        this.ready = true;
    }
    this.update = function (users) {
        let i = GROOMS.findIndex(room => room.id == this.roomid);
        if (i == -1 || this.player == null) return;

        let player = this.player;
        let speed = GROOMS[i].model.map.square[Math.floor((this.player.y) / 50)][Math.floor((this.player.x) / 50)].speed;
        player.health -= parseFloat(GROOMS[i].model.map.square[Math.floor((this.player.y) / 50)][Math.floor((this.player.x) / 50)].damage);
        let oldX = this.player.x;
        let oldY = this.player.y;
        this.player.direction = rotatetoTraget(this.player.direction, this.direction, 0.05);
        if (!this.target) {
            this.player.x += parseFloat(speed * .6 * Math.sin(this.player.direction));
            this.player.y += parseFloat(speed * .6 * Math.cos(this.player.direction));
            if (this.eventTime < 0) {
                this.eventTime = Math.floor(Math.random() * 1000);
                this.direction = Math.random() * Math.PI * 2;
            } else {
                this.eventTime--;
            }
        } else {
            this.player.take.apply(this.player.x, this.player.y, this.player.direction, GROOMS[i].bulletPhysics, this.id, this.player);
            this.player.take.triggered = 0;
        }


        if (!GROOMS[i].model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !GROOMS[i].model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
            !GROOMS[i].model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !GROOMS[i].model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
            player.y = oldY;

        if (!GROOMS[i].model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !GROOMS[i].model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
            !GROOMS[i].model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !GROOMS[i].model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
            player.x = oldX;


        player.take.pos(player);
        users.forEach(user => {
            if (user.player.status != HIDDENBODY) {
                if (!this.target) {
                    let f = distance(this.player.x, this.player.y, user.player.x, user.player.y);
                    if (f < this.eyesight) {
                        this.target = user.id;
                        this.direction = getAngle(this.player.x, this.player.y, user.player.x, user.player.y);
                    }
                } else if (user.id == this.target) {
                    if (distance(this.player.x, this.player.y, user.player.x, user.player.y) < this.eyesight) {
                        this.direction = getAngle(this.player.x, this.player.y, user.player.x, user.player.y);
                    } else {
                        this.target = false;
                    }
                }
            }
        });

    };
    this.send = function () {
    }
    this._init(roomid);
}

class GameEngine {
    constructor() {
        this.id = generateitemId();
        this.name = "normal"
        this.interval = null;
        this.wx = 0;
        this.wy = 0;
        this.model = new Model();
        this.bulletPhysics = this.model.getBulletPhysics();
        this.users = [];
        this._init();
    }

    _init() {
        this.interval = setInterval(() => {
            this.loop();
        }, 1000 / 60);

        setTimeout(() => {
            for (var i = 0; i < 15; i++) {
                this.users.push(new BotAI(i % 2 == 0 ? `Timon(${i})` : `PRG(${i})`, this.id));
            }
            console.log("Created bots");
        }, 1000);
    }

    join(player) {
        this.users.push(player);
    }

    out(player) {
        let i = this.users.findIndex(p => p.id == player.id);
        if (i != -1) {
            this.users.splice(i, 1);
        }
    }

    loop() {
        const users = this.users
            .filter(p => {
                if (p.player != null) {
                    if (this.model.leaderboard.array[0] && p.id == this.model.leaderboard.array[0].id) {
                        this.wx = p.player.x;
                        this.wy = p.player.y;
                    }
                    return true;
                }
                return false;
            })
        const players = users.map(p => {
            return p.player;
        });

        this.bulletPhysics.checkRange();
        const hits = [];
        const itemchanged = [];

        this.bulletPhysics.update(this.model.getMap(), hits);
        this.bulletPhysics.checkHits(players, hits);

        this.model.getItems().checkCollisions(players, itemchanged);


        for (const thisPlayer of this.users) {

            if (!thisPlayer.ready) continue;

            const { player, id, bot, watch, x, y } = thisPlayer;

            if (player) {
                if (player.status === INVINCIBILITY || player.status === HIDDENBODY) {
                    player.statusTime--;
                    if (player.statusTime < 0) {
                        player.status = REALBODY;
                    }
                }

                if (bot) thisPlayer.update(users.filter(({ bot }) => !bot));

                if (player.health <= 0) {
                    this.sendPlayerEvent(PLAYER_REMOVE, { id });
                    this.sendLeaderboard(this.model.leaderboard.addPoint(player.killedBy));
                    thisPlayer.player.dropItem(this.model.getItems().array, itemchanged);
                    thisPlayer.send(DEATH);
                    thisPlayer.player = null;
                    if (bot) {
                        thisPlayer._init(this.id);
                        continue;
                    } else {
                        this.model.leaderboard.remove(player.id);
                    }
                }
            }

            if (!watch) {
                if (player) {
                    this.wx = player.x;
                    this.wy = player.y;
                } else {
                    this.wx = 1200;
                    this.wy = 900;
                }
            }

            thisPlayer.x += (this.wx - x) / 30;
            thisPlayer.y += (this.wy - y) / 30;

            this.broadcast(thisPlayer, hits);
        }

        if (itemchanged.length > 0) {
            this.users.forEach(p => p.send(SEND_ITEM_CHANGED, itemchanged));
        }
    }

    playerOpen(user) {
        let x, y;
        do {
            x = Math.floor(Math.random() * 5000);
            y = Math.floor(Math.random() * 5000);
        } while (!this.model.map.square[Math.floor(y / 50)][Math.floor(x / 50)].isPassable)
        this.sendPlayerEvent(NEW_PLAYER_GREATE,
            {
                id: user.id,
                name: user.name
            });

        user.player = this.model.getNewPlayer(x, y, 1000, 0, user.name, user.id);

        this.sendLeaderboard(this.model.leaderboard.addEntry(user.name, user.id, 0, user.dbid));
    }

    plyaerControl(player, data) {
        let speed = this.model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].speed;
        player.health -= parseFloat(this.model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x) / 50)].damage);
        let oldX = player.x;
        let oldY = player.y;
        player.direction = parseInt(data.direction * 100) / 100;

        if (data.m) {
            player.x += parseFloat(speed * .6 * Math.cos(data.mangle));
            player.y += parseFloat(speed * .6 * Math.sin(data.mangle));
        }

        if (!this.model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !this.model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
            !this.model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !this.model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
            player.y = oldY;

        if (!this.model.map.square[Math.floor((player.y + 25) / 50)][Math.floor((player.x) / 50)].isPassable || !this.model.map.square[Math.floor((player.y - 25) / 50)][Math.floor((player.x) / 50)].isPassable ||
            !this.model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x + 25) / 50)].isPassable || !this.model.map.square[Math.floor((player.y) / 50)][Math.floor((player.x - 25) / 50)].isPassable)
            player.x = oldX;

        // if (player.take instanceof Tool) {
        player.take.pos(player)
        // }

        if (data.LMB == true) {
            player.take.apply(player.x, player.y, player.direction, this.bulletPhysics, player.id, player);
        } else
            player.take.triggered = 0;
    }

    broadcast(thisPlayer, _hits) {
        const { id, x, y, eyesight } = thisPlayer;

        const emitPlayers = [];
        const bullets = [];

        for (const otherPlayer of this.users) {
            const p = otherPlayer.player;
            if (p && (p.status !== HIDDENBODY || otherPlayer.id === id)) {
                if (distance(x, y, p.x, p.y) < eyesight) {
                    emitPlayers.push([p.x, p.y, p.direction, otherPlayer.id, p.take.type, p.r, p.health, p.status]);
                }
            }
        }

        for (const b of this.bulletPhysics.bullets) {
            if (distance(x, y, b.x, b.y) < eyesight) {
                bullets.push([parseInt(b.x), parseInt(b.y), b.id]);
            }
        }

        thisPlayer.send(UPDATE_KEY, [
            emitPlayers,
            x, y,
            bullets,
            _hits.filter(_hit => distance(x, y, _hit[1], _hit[2]) < eyesight),
            this.id
        ]);
    }

    stop() {
        clearInterval(this.interval)
    }

    sendLeaderboard() {
        let border = this.model.leaderboard.array.slice(0, 6).map(({ name, score }) => ({ name, score }));
        this.users.forEach(p => {
            p.send(SEND_LEADERBORD, { ranking: border, count: this.model.leaderboard.array.length });
        });
    }

    sendPlayerEvent(key, data) {
        this.users.forEach(p => {
            p.send(key, data);
        });
    }

    sendMsg(data) {
        this.users.forEach(p => {
            p.send(SEND_MSG, data);
        })
    }

    playerClose(user) {
        this.sendLeaderboard(this.model.leaderboard.remove(user.id));
        user.player = null;
        const i = this.users.findIndex(p => p.id == user.id);
        i != -1 && this.users.splice(i, 1);
    }
}

