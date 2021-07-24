const {v4: uuidv4} = require("uuid");
const {allowedPaths,adminPaths} = require(process.cwd()+"/config.json");

const users = {};

function createSession(acc){
    var uuid = uuidv4();
    users[uuid] = acc.id;

    return uuid;
}

function getSession(cookie){
    if(!cookie) {
        console.log("NO COOKIES FOUND");
        return null;
    }

    if(!cookie.account) return null;

    var uuid = cookie.account;
    if(!users[uuid]) return null;

    return users[uuid];
}

function getSessionId(cookie){
    if(!cookie.account) return null;

    return cookie.account;
}

function destorySession(sessionId){
    delete users[sessionId];
}

function allowedUrl(url, login=false, admin=0){
    if(!login){
        for(var i=0;i<allowedPaths.length;i++){
            if(url.startsWith(allowedPaths[i])) return true;
        }
        return false;
    }

    if(admin==0) {
        for(var i=0;i<adminPaths.length;i++){
            if(url.startsWith(adminPaths[i])) return false;
        }
    }

    return true;
}

function getSavedUsers(){
    var online = [];
    for(var x in users){
        online.push(users[x]);
    }
    return online;
}

module.exports = {
    getSession,
    getSessionId,
    allowedUrl,
    createSession,
    destorySession,
    getSavedUsers
};