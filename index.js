const fs = require('fs');

createConfig();

const setup = require("./src/setup");
const dbManager = require("./src/databaseManager");
const accountController = require("./src/account/controller");
const projectController = require("./src/project/controller");
const projectConsole = require("./src/project/console");
const system = require("./src/utils/system");
const terminator = require("./src/utils/terminator");
const config = require("./config.json");
const logger = require("./src/utils/logger");

enable();

async function enable() {
    process.on("uncaughtException", (err) => {
        if (config["error-trace"]) {
            logger.emergency(err.stack);
        } else {
            logger.emergency(err);
        }

        kill();
    });

    logger.custom("---------------------------------------------", true);
    logger.info("Starting the panel");

    logger.debug(`Operating System ${process.platform} detected`)

    if (!system.valid()) {
        logger.warn(`You are using a unsupported Operating System (${process.platform}), please use a supported OS (${system.supported})`);
        kill();
        return;
    }

    await setup.createFiles();

    await dbManager.connect();
    await projectController.setup();
    await projectConsole.start();
    await accountController.setup();
    var accounts = await accountController.getAll();
    if (accounts.length <= 0) {
        logger.warn("No accounts found in the database");
        setup.createAccount(function () {
            startServer();
        });
        return;
    }


    startServer();
}


function startServer() {
    terminator.add("main", module.exports);
    const server = require("./src/server");
}

/**
 * Kill the server
 */
function kill() {
    logger.info("Stopping the server...");
    process.kill(process.pid);
}

/**
 * Create the config
 */
function createConfig() {
    var configData = {};
    try{
        configData = JSON.parse(fs.readFileSync(`${process.cwd()}/config.json`))
    }catch(err){}

    if(!configData.hasOwnProperty("ip")) configData.ip = "127.0.0.1";
    if(!configData.hasOwnProperty("port")) configData.port = 8000;
    if(!configData.hasOwnProperty("allowedPaths")) configData.allowedPaths = [
            "/favicon.ico",
            "/login",
            "/api/online",
            "/api/console/"
        ];
    if(!configData.hasOwnProperty("adminPaths")) configData.adminPaths = [
            "/admin"
        ];
    if(!configData.hasOwnProperty("debug")) configData.debug = false;
    if(configData.hasOwnProperty("debug-errors")) configData["debug-errors"] = false;
    if(!configData.hasOwnProperty("error-trace")) configData["error-trace"] = true;
    if(!configData.hasOwnProperty("log-file")) configData["log-file"] = true;

    try{
        fs.writeFileSync(`${process.cwd()}/config.json`, JSON.stringify(configData, 0, 4));
    } catch(err){
        console.error(err);
        process.kill(process.pid);
    }
}

module.exports = {
    kill
}
