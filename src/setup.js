const accountController = require("./account/controller");
const {encrypt} = require("./security/crypto");
const logger = require("./utils/logger");
const system = require("./utils/system")
var processListener = true;
const fs = require("fs");


async function createAccount(cb){
    logger.info("The setup is not completed, answer the questions to finish the setup");

    const anwsers = {
        "username": null,
        "email": null,
        "password": null
    }
    var q = 0;


    process.stdout.write("What is your username? ");
    processListener = process.stdin.on("data", (data)=>{
        if(!processListener) return;
        data = system.removeLines(data.toString());
        

        if(q == 0) {
            anwsers.username = data;
            process.stdout.write("What is your email? ");
        }
        if(q == 1) {
            anwsers.email = data;
            process.stdout.write("Wat is your password? ");
        }
        if(q == 2) {
            anwsers.password = JSON.stringify(encrypt(data));
            process.stdout.write("Is this correct? [Y|n] ");
        }
        if(q == 3){
            if(data.toLowerCase() === "n" || data.toLowerCase() === "no"){
                logger.info("Data marked as incorrect, please anwser the questions correctly to continue");
                process.stdout.write("What is your username? ");
                q = 0;
                return;
            }

            processListener = false;

            finishCreateAccount(anwsers, cb)
        }
        q++;
    });
}
async function finishCreateAccount(anwsers, callback){
    var data = await accountController.create(anwsers.email, anwsers.username, anwsers.password);
    await accountController.setAdmin(data.id,2);

    logger.info("Admin account succesful created");
    logger.info("Starting the server...");
    callback();
}

/**
 * Create all missing required files and folders
 */
async function data(){
    logger.debug("Checking for missing files and folders...");
    var dir = process.cwd();
    fs.readFile(`${dir}/config.json`, (err)=>{
        if(err){
            logger.debug("Creating the config file");
            fs.writeFile(`${dir}/config.json`, JSON.stringify({
                    "ip": "127.0.0.1",
                    "port": 8000,
                    "allowedPaths": [
                        "/favicon.ico",
                        "/login",
                        "/api/online",
                        "/api/console/"
                    ],
                    "adminPaths": [
                        "/admin"
                    ],
                    "debug": true,
                    "debug-errors": false,
                    "error-trace": true,
                    "log-file": true
                }, 0, 4), (err)=>{
                    if(err){
                        logger.error(err);
                        return;
                    }
                    logger.debug("Created the config file");
            });
        }
    });

    try{
        fs.readdirSync(`${dir}/data`);
    }catch(err){
        logger.debug("Creating the data folder");
        try{
            fs.mkdirSync(`${dir}/data`);
            logger.debug("Created the data folder");
        } catch(err){
            if(err){
                logger.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/data/tmp`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/tmp`);
            logger.debug("Created the tmp folder");
        }
        catch(err){
            if(err){
                logger.error(err);
            }
        }
    }
    
    try{
        fs.readdirSync(`${dir}/data/submissions`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/submissions`);
            logger.debug("Created the submissions folder");
        }
        catch(err){
            if(err){
                logger.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/data/rejections`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/rejections`);
            logger.debug("Created the rejections folder");
        }
        catch(err){
            if(err){
                logger.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/data/projects`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/projects`);
            logger.debug("Created the backup projects folder");
        }
        catch(err){
            if(err){
                logger.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/projects`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/projects`);
            logger.debug("Created the projects folder");
        }
        catch(err){
            if(err){
                logger.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/data/deleted`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/deleted`);
            logger.debug("Created the deleted folder");
        }
        catch(err){
            if(err){
                logger.error(err);
            }
        }
    }
}


module.exports = {
    createAccount,
    data
}