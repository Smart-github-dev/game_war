'use strict';
require("dotenv").config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const compression = require('compression');
const bodyParser = require('body-parser');

const db = require('./mongoose.js');
const gameSocket = require("./socket.js");

const router = require("./router.js");

// if (process.env.KEY != (new Date()).getMonth() + "TIMON") {
//   console.log("KEY error!!");
//   return;
// }

const PORT = process.env.PORT || 3012;
const SOCKET_PORT = process.env.SOCKET_PORT || 54072

db(() => {
  let app = express();

  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true, limit: "200mb" }));

  app.use(express.static(__dirname + '/public'));

  app.use("/api", router);

  http.Server(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else {
      const wss = new WebSocket.Server({ port: SOCKET_PORT });
      gameSocket(wss);
      console.log("Server running");
    }
  });
});

require('dns')
  .lookup(require('os')
    .hostname(),
    (err, add, fam) => {
      console.log('addr: ' + add);
    }
  )






