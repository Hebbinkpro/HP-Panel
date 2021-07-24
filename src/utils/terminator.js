const logger = require("./logger");

const processes = {}

async function add(name,process){
    if(!process.kill) {
        logger.error(`It isn't possible to kill process ${name}`);
        return;
    }
    logger.debug(`Added process: ${name}`);
    processes[name] = process;
}

async function kill(name){
    if(!processes[name]){
        logger.warn(`Process ${name} not found!`);
        return;
    }
    logger.info(`Terminating the ${name} process`);
    processes[name].kill();
}

module.exports = {
    add,
    kill
}