const child_process = require("child_process");
const fs = require("fs");
const logger = require("../utils/logger");
const system = require("../utils/system");

const commandMap = {};

async function openTerminal(){
    if(module.exports.terminal){
        logger.warn("The terminal is already running!");
        return;
    }

    var next = await loadCommands();
    if(!next){
        logger.error("Terminal startup is cancelled")
        return;
    }

    module.exports.terminal = true;
    process.stdin.on("data", async(data)=>{
        var commandString = system.removeLines(data.toString());
        var commandData = commandString.split(" ");
        var cmd = commandData[0].toLowerCase();
        var args = commandData;
        args.shift();
        
        if(!commandMap[cmd]){
            logger.error("This command doesn't exists");
            return;
        }

        logger.custom(`Command Executed: ${commandString}`, true)
        await commandMap[cmd].execute(args);
    })

    logger.info("The terminal is listening to commands");
}

async function loadCommands(){
    try{
        var files = fs.readdirSync(__dirname+"/commands");
    } catch(err){
        logger.warn("[Command Loader] [WARNING] The commands folder doesn't exists");
        return false;
    }
    
    var jsFiles = files.filter(f => f.split(".").pop() === "js");

    if (jsFiles.length <= 0) {
        logger.debug("[Command Loader] No commands found in the commands folder");
        return false;
    }

    for(var x in jsFiles){
        var file = jsFiles[x];
        var command = require(`${__dirname}/commands/${file}`);
        if(!command.execute || !command.name){
            console.error(`Couldn't load command ${file}`);
            continue;
        }
        var res = await addCommand(command.name, command);
        if(res && command.aliases){
            command.aliases.forEach(alias=>{
                addCommand(alias, command);
            });
        }

    }

    return true;
}

async function addCommand(name,command){
    if(commandMap[name]){
        logger.warn(`[Command Loader] The command '${name}' is already registerd in the command '${commandMap[name].name}'`);
        return false;
    }

    commandMap[name] = command;
    logger.debug(`[Command Loader] The command '${name}' is registered`);
    return true;
}



module.exports = {
    terminal: false,
    openTerminal
}