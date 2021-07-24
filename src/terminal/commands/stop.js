const terminator = require("../../utils/terminator")
const logger = require("../../utils/logger")

async function execute(args){
    terminator.kill("main");
}

module.exports = {
    name: "stop",
    aliases: [],
    execute
}