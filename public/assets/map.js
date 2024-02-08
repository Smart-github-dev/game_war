class MakingMap {
    constructor() {
        this.container = document.createElement("div");
        this.container.className = "map_paint";
        this.container.style.cursor = "move";
        this.initialFingerDistance = 0;
        this.currentFingerDistance = 0;
        this.mousedown = false;
        this.draw = false;
        this.startpos = {
            x: 0,
            y: 0
        }
        this.recordpos = {
            x: 0,
            y: 0
        }
        this.zoom = 1;
        this.items = [
            {
                name: "soil",
                description: "soil",
                imgurl: "./assets/sprites/soil.png",
                info: {
                    damage: 0,
                    friction: 5.3,
                    floor: true
                }
            },
            {
                name: "sand",
                description: "sand",
                imgurl: "./assets/sprites/sand.png",
                info: {
                    damage: 0,
                    friction: 3,
                    floor: true
                }
            },
            {
                name: "grass",
                description: "grass",
                imgurl: "./assets/sprites/grass.png",
                info: {
                    damage: 0,
                    friction: 5,
                    floor: true
                }
            },
            {
                name: "water",
                description: "water",
                imgurl: "./assets/sprites/water.png",
                info: {
                    damage: .1,
                    friction: 2,
                    floor: true
                }
            },
            {
                name: "lava",
                description: "lava",
                imgurl: "./assets/sprites/lava.png",
                info: {
                    damage: 5,
                    friction: 7,
                    floor: true
                }
            },
            {
                name: "brick",
                description: "brick",
                imgurl: "./assets/sprites/brick.png",
                info: {
                    damage: 0,
                    friction: 0,
                    floor: false
                }
            },
            {
                name: "floor",
                description: "floor",
                imgurl: "./assets/sprites/floor.png",
                info: {
                    damage: 0,
                    friction: 5,
                    floor: true
                }
            },
        ];
        this.mapTiles;
        this.select_tile = this.items[0];
        $("#tileview").attr("src", this.select_tile.imgurl);
        $("#tiledescription").html(this.select_tile.description);
    }

    addNewTile() { }

    showTile() {
        $("#tile_list").html(this.items.map(item => {
            return `<button class="p-0 mb-1 ${item.name == this.select_tile.name ? 'bg-warning' : ''}" id="create_tile" data-toggle="tooltip" data-placement="top" title="${item.description}" onclick="selectTile('${item.name}')">
            <img src="${item.imgurl}" alt="map_icon" width="30px" height="30px">
          </button>`
        }).concat(`<button class="p-0 mb-1" data-toggle="tooltip" data-placement="top" title="new tile create" onclick="showNewTileEdit()">
        <img src="./assets/img/create_tile.svg" alt="create_icon" width="30px" height="30px">
      </button>`));
    }

    makeMap() {
        this.mapTiles = [];
        for (var i = 0; i < 100; i++) {
            this.mapTiles[i] = [];
            for (var j = 0; j < 100; j++) {
                if (i == 0 || j == 0 || i == 99 || j == 99)
                    this.mapTiles[i][j] = this.items[5];
                else
                    this.mapTiles[i][j] = this.items[0];
            }
        }


        this.showMap();
    }

    showMap() {
        this.container.innerHTML = "";
        this.container.className = "mapcontainer";
        for (var i = 0; i < 100; i++) {
            var row = document.createElement("div");
            row.className = "map_row";
            for (var j = 0; j < 100; j++) {
                var cell = document.createElement("img");
                cell.draggable = false;
                cell.className = "map_cell";
                cell.width = 50;
                cell.height = 50;
                cell.row_index = i;
                cell.cell_index = j;
                cell.src = this.mapTiles[i][j].imgurl;
                row.appendChild(cell);
                if (i == 0 || j == 0 || i == 99 || j == 99)
                    continue
                cell._name = this.mapTiles[i][j].name;
            }
            this.container.appendChild(row);
        }
        $("#paint").html(this.container);
    }

    handleDown(event) {
        editmap.applyTile(event);
        editmap.mousedown = true;

        if (event.clientX) {
            if (!editmap.draw) {
                editmap.startpos.x = event.clientX;
                editmap.startpos.y = event.clientY;
            }
        } else if (event.touches) {
            var touches = event.touches;
            if (touches.length === 2) {
                editmap.initialFingerDistance = Math.hypot(touches[1].pageX - touches[0].pageX, touches[1].pageY - touches[0].pageY);
            } else {
                editmap.startpos.y = touches[0].clientY;
                editmap.startpos.x = touches[0].clientX;
            }
        }

        editmap.recordpos.x = editmap.container.offsetLeft;
        editmap.recordpos.y = editmap.container.offsetTop;

    }

    handleUp(event) {
        editmap.mousedown = false;
    }

    handleLeave(event) {
        event.preventDefault();
        editmap.mousedown = false;
    }

    applyTile(event) {
        if (editmap.draw) {
            if (event.target._name != editmap.select_tile.name) {
                event.target.src = editmap.select_tile.imgurl;
                event.target._name = editmap.select_tile.name;
                editmap.mapTiles[event.target.row_index][event.target.cell_index] = editmap.select_tile;
            }
        }
    }

    toutchdrawhandle(event) {
        event.preventDefault();
        var touchX = event.touches[0].clientX;
        var touchY = event.touches[0].clientY;
        var touches = event.touches;
        if (touches.length === 2) {
            editmap.currentFingerDistance = Math.hypot(touches[1].pageX - touches[0].pageX, touches[1].pageY - touches[0].pageY);
            $(editmap.container).css('transform', 'scale(' + editmap.zoom * editmap.currentFingerDistance / editmap.initialFingerDistance + ')');
        } else {
            if (editmap.draw) {
                var touchedElement = document.elementFromPoint(touchX, touchY);
                if (touchedElement && typeof touchedElement._name != 'undefined') {
                    editmap.applyTile({ target: touchedElement });
                }
            } else if (editmap.mousedown) {
                $(editmap.container).css({
                    'position': 'absolute',
                    'top': (editmap.recordpos.y + touchY - editmap.startpos.y) + "px",
                    'left': (editmap.recordpos.x + touchX - editmap.startpos.x) + "px"
                });
            }
        }

    }

    mousedrawhandle(event) {
        event.preventDefault();
        if (!editmap.mousedown) {
            return;
        }
        var touchX = event.clientX;
        var touchY = event.clientY;
        if (editmap.draw) {
            var touchedElement = document.elementFromPoint(touchX, touchY);
            if (touchedElement && typeof touchedElement._name != 'undefined') {
                editmap.applyTile({ target: touchedElement });
            }
        } else if (editmap.mousedown) {
            $(editmap.container).css({
                'position': 'absolute',
                'top': (editmap.recordpos.y + touchY - editmap.startpos.y) + "px",
                'left': (editmap.recordpos.x + touchX - editmap.startpos.x) + "px"
            });
        }
    }

    addListen() {
        this.container.addEventListener('mousedown', this.handleDown);
        this.container.addEventListener('mousemove', this.mousedrawhandle);
        window.addEventListener('mouseup', this.handleUp);
        this.container.addEventListener('mouseleave', this.handleLeave);
        this.container.addEventListener("touchmove", this.toutchdrawhandle);
        this.container.addEventListener("touchstart", this.handleDown);
        window.addEventListener("touchend", this.handleUp);
        $(this.container).on('wheel', this.zoomhandle)
    }

    removeListen() {
        this.container.removeEventListener('mousedown', this.handleDown);
        this.container.removeEventListener('mousemove', this.mousedrawhandle);
        window.removeEventListener('mouseup', this.handleUp);
        this.container.removeEventListener('mouseleave', this.handleLeave);
        this.container.removeEventListener("touchmove", this.toutchdrawhandle);
        this.container.removeEventListener("touchstart", this.handleDown);
        window.removeEventListener("touchend", this.handleUp);
        $(this.container).off('wheel', this.zoomhandle)
    }

    zoomhandle(event) {
        var wheelDelta = event.originalEvent.deltaY;
        if (wheelDelta > 0) {
            editmap.zoom -= 0.02;
            if (editmap.zoom < 0.1) {
                editmap.zoom = 0.1
            }
        } else {
            editmap.zoom += 0.02;
            if (editmap.zoom > 1) {
                editmap.zoom = 1
            }
        }

        $(editmap.container).css("transform", `scale(${editmap.zoom})`);
    }
}

function selectTile(name) {
    editmap.select_tile = editmap.items.find(item => item.name == name);
    editmap.showTile();
    $("#tileview").attr("src", editmap.select_tile.imgurl);
    $("#tiledescription").html(editmap.select_tile.description);
}

const editmap = new MakingMap();
editmap.showTile();
editmap.makeMap();

function clearMap() {
    editmap.makeMap();
}

$("#create_map").hide();

function mapeditshow() {
    $("#menu").hide();
    $("#create_map").show();
    editmap.addListen();
}

function outMapEdit() {
    $("#menu").show();
    $("#create_map").hide();
    editmap.removeListen();
}

function saveMap() {

}

function zoom(i) {
    if (i == -1) {
        editmap.zoom -= .02;
        if (editmap.zoom < 0.1) {
            editmap.zoom = 0.1
        }
        $(editmap.container).css("transform", `scale(${editmap.zoom})`);
    } else {
        editmap.zoom += .02;
        if (editmap.zoom > 1) {
            editmap.zoom = 1
        }
        $(editmap.container).css("transform", `scale(${editmap.zoom})`);
    }
}

function showNewTileEdit() {
    $("#newtile_create").modal("show");
}

function mapMove() {
    editmap.draw = false;
    editmap.container.style.cursor = "move";
}

function mapDraw() {
    editmap.draw = true;
    editmap.container.style.cursor = "pointer";
}