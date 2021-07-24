const dbManager = require("./src/databaseManager");
const accountController = require("./src/account/controller");
const projectController = require("./src/project/controller");
const projectConsole = require("./src/project/console");
const setup = require("./src/setup");
const logger = require("./src/utils/logger");
const system = require("./src/utils/system");
const terminator = require("./src/utils/terminator");
const config = require("./config.json");

process.on("uncaughtException", (err)=>{
    if(config["error-trace"]){
        logger.emergency(err.stack);
    } else {
        logger.emergency(err);
    }
    
    kill();
});

enable();

async function enable(){
    logger.custom("---------------------------------------------", true);
    logger.info("Starting the panel");

    logger.debug(`Operating System ${process.platform} detected`)

    if(!system.valid()){
        logger.warn(`You are using a unsupported Operating System (${process.platform}), please use a supported OS (${system.supported})`);
        kill();
        return;
    }

    await setup.data();

    await dbManager.connect();
    await projectController.setup();
    await projectConsole.start();
    await accountController.setup();
    var accounts = await accountController.getAll();
    if(accounts.length <= 0){
        logger.warn("No accounts found in the database");
        setup.createAccount(function(){
            startServer();
        });
        return;
    }

    
    startServer();
}

function startServer(){
    terminator.add("main", module.exports);
    const server = require("./src/server");
}

function kill(){
    logger.info("Stopping the server...");
    process.kill(process.pid);
}

module.exports = {
    kill
}