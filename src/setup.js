const accountController = require("./account/controller");
const {encrypt} = require("./security/crypto");
const system = require("./utils/system")
var processListener = true;
const fs = require("fs");

async function createAccount(callback){
    const logger = require("./utils/logger");
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

            finishCreateAccount(anwsers, callback)
        }
        q++;
    });
}

async function finishCreateAccount(anwsers, callback){
    const logger = require("./utils/logger");
    var data = await accountController.create(anwsers.email, anwsers.username, anwsers.password);
    await accountController.setAdmin(data.id,2);

    logger.info("Admin account succesful created");
    logger.info("Starting the server...");
    callback();
}

async function createFiles(){
    var dir = process.cwd();
    
    try{
        fs.readdirSync(`${dir}/data`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data`);
        } catch(err){
            if(err){
                console.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/data/tmp`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/tmp`);
        }
        catch(err){
            if(err){
                console.error(err);
            }
        }
    }
    
    try{
        fs.readdirSync(`${dir}/data/submissions`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/submissions`);
        }
        catch(err){
            if(err){
                console.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/data/rejections`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/rejections`);
        }
        catch(err){
            if(err){
                console.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/data/projects`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/projects`);
        }
        catch(err){
            if(err){
                console.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/projects`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/projects`);
        }
        catch(err){
            if(err){
                console.error(err);
            }
        }
    }

    try{
        fs.readdirSync(`${dir}/data/deleted`);
    }catch(err){
        try{
            fs.mkdirSync(`${dir}/data/deleted`);
        }
        catch(err){
            if(err){
                console.error(err);
            }
        }
    }
}

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
    createAccount,
    createFiles,
    createConfig
}