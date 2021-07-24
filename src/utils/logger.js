const config = require("../../config.json");
const fs = require("fs");
const system = require("../utils/system")

const dirs = {
    "/web": "Web",
    "/security": "Security",
    "/terminal/commands": "Command: {file}",
    "/terminal": "Terminal",
    "/project": "Project",
    "default": "HP Panel"
}

const files = {
    "/utils/terminator.js": "Terminator"
}

function getTime(){
    var date = new Date();
    var milli = date.getMilliseconds() < 100 ? (date.getMilliseconds() < 10 ? "00"+date.getMilliseconds() : "0"+date.getMilliseconds()) : date.getMilliseconds();
    return date.toLocaleTimeString('nl-NL', {timeZone: 'Europe/Amsterdam', hour12: false}) + "." + milli;
}

function getPrefix(){
    var myError = new Error();
    var trace = myError.stack.split('\n');
    trace = trace[3];

    var location = trace.substr(trace.lastIndexOf('(') + 1);
    var path = location.substr(0, location.indexOf(':', 2));
    while(path.indexOf("\\") > -1) {
        path = path.replace("\\", "/");
    }

    var dir = path.substr(0, path.lastIndexOf('/'));
    var file = path.substr(path.lastIndexOf('/')+1).replace(".js", "");

    var mainDir = process.cwd();
    while(mainDir.indexOf("\\") > -1) {
        mainDir = mainDir.replace("\\", "/");
    }

    if(dir.endsWith("/src") || dir === mainDir){
        return "HP Panel";
    }

    for(var j in files){
        if(path.endsWith(j)){
            return files[j];
        }
    }

    for(var i in dirs){
        if(dir.endsWith(i)){
            return dirs[i].replace("{file}",capitalizeFirstLetter(file));
        }
    }

    return capitalizeFirstLetter(dir.substr(dir.lastIndexOf("/")+1));
}

function info(message){
    var prefix = getPrefix();

    if(message instanceof Error){
        if(config["error-trace"]){
            message = message.stack;
        }
    }

    log(`\x1b[96m[${getTime()}] \x1b[0m[${prefix}] [Info] ${message}`);
}

function debug(message){
    var prefix = getPrefix();

    if(message instanceof Error){
        if(!config["debug-errors"]) return;

        if(config["error-trace"]) message = message.stack;
    }

    log(`\x1b[96m[${getTime()}] \x1b[90m[${prefix}] [Debug] ${message}\x1b[0m`, !config.debug);
}

function warn(message){
    var prefix = getPrefix();

    if(message instanceof Error){
        if(config["error-trace"]){
            message = message.stack;
        }
    }

    log(`\x1b[96m[${getTime()}] \x1b[33m[${prefix}] [Warning] ${message}\x1b[0m`);
}

function error(message){
    var prefix = getPrefix();

    if(message instanceof Error){
        if(config["error-trace"]){
            message = message.stack;
        }
    }

    log(`\x1b[96m[${getTime()}] \x1b[91m[${prefix}] [Error] ${message}\x1b[0m`);
}

function emergency(message){
    var prefix = getPrefix();

    if(message instanceof Error){
        if(config["error-trace"]){
            message = message.stack;
        }
    }

    log(`\x1b[96m[${getTime()}] \x1b[31m[${prefix}] [EMERGENCY] ${message}\x1b[0m`);
}

function custom(message, hide=false, color="\x1b[0m"){
    var prefix = getPrefix();

    if(message instanceof Error){
        if(config["error-trace"]){
            message = message.stack;
        }
    }

    log(`\x1b[96m[${getTime()}] ${color}[${prefix}] ${message}`,hide);
}

function capitalizeFirstLetter(message) {
    return message.charAt(0).toUpperCase() + message.slice(1);
}

function log(message, hide=false){
    if(!hide) console.log(message);

    if(config["log-file"]) saveToLogFile(message);
}

function saveToLogFile(message){
    
    if(message.indexOf("\x1b[")>-1){
        var msg = "";
        var msgParts = message.split("\x1b[");
        for(var i in msgParts){
            var part = msgParts[i];
            if(part.indexOf("m") > -1){
                part = part.slice(part.indexOf("m")+1);
                msg+=part;
            }
        }
        message = msg;
    }
    

    try{
        var fileContent = fs.readFileSync(`${process.cwd()}/data/console.log`).toString();
    }catch(err){
        var fileContent = "";
    }

    fileContent += `${system.newLine}${message}`;
    if(fileContent === ""){
        fileContent = message;
    }

    fs.writeFileSync(`${process.cwd()}/data/console.log`, fileContent);
}

module.exports = {
    info,
    debug,
    warn,
    error,
    emergency,
    custom
}
  