const accountController = require("../../account/controller");
const logger = require("../../utils/logger")

async function execute(args){
    if(!args[0]){
        logger.warn("No id given");
        return;
    }
    var id = parseInt(args[0]);

    var adminPerms = 1;
    if(args[1]) adminPerms = parseInt(args[1]);
    if(adminPerms < 0 || adminPerms > 2) {
        logger.warn("No valid perm given");
        return;
    }
    await accountController.setAdmin(id,adminPerms);
    
    logger.info("Account with id " + id + " has now admin level " + adminPerms);
}

module.exports = {
    name: "setadmin",
    aliases: [],
    execute
}