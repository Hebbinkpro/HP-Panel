// NODE MODULES
const express = require("express");
const app = express();
module.exports.getApp = ()=>{
    return app;
}

// CUSTOM MODULES
const config = require("../config.json");
const terminal = require("./terminal/manager");
const logger = require("./utils/logger");
var saves = {};

const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// OTHER CONSTANTS
const cookieSecret = "ProtectHPServerPanel"

// EXPRESS SETUP
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(cookieParser(cookieSecret));
app.use(session({
    secret: cookieSecret,
    resave: true,
    saveUninitialized: true
}));

const listener = app.listen(config.port, () => {
    logger.info(`The web server is running on: http://${config.ip}:${config.port}`);
});

const webManager = require("./web/manager");
terminal.openTerminal();