const projectController = require("./controller");
const pidusage = require("pidusage");
const serverConsoleCache = {};
const consoleData = {};

module.exports = {
    consoleData,
    started: false,
    saveServerCache,
    sendServerCache,
    start: ()=>{
        if(this.started) return;
        updateServerCache();
        this.started = true;
    },
    getServerCache
}

function sendServerCache(serverId, res){
    projectController.getById(serverId).then(server=>{
        if(server.approved == 0 && server.active == 0){
            res.json({state: "Rejected", console:[], htmlState: `<span style="color:red;">Rejected</span>`});
            return;
        }
        if(server.approved == 0) {
            res.json({state: "Submitted", console:[], htmlState: `<span style="color:red;">Submitted</span>`});
            return;
        };
        if(server.active == 0) {
            res.json({state: "Inactive", console:[], htmlState: `<span style="color:red;">Inactive</span>`});
            return;
        };
        if(!serverConsoleCache[serverId]) {
            res.json({state: "Offline", console:[], htmlState: `<span style="color:red;">Offline</span>`});
            return;
        };

        res.json(serverConsoleCache[serverId]);
        return;
    });
}

async function getServerCache(serverId){
    var server = await projectController.getById(serverId);
    if(server.approved == 0 && server.active == 0){
        return {state: "Rejected", console:[], htmlState: `<span style="color:red;">Rejected</span>`};
    }
    if(server.approved == 0) {
        return {state: "Submitted", console:[], htmlState: `<span style="color:red;">Submitted</span>`};
    };
    if(server.active == 0) {
        return {state: "Inactive", console:[], htmlState: `<span style="color:red;">Inactive</span>`};
    };
    if(!serverConsoleCache[serverId]) {
        return {state: "Offline", console:[], htmlState: `<span style="color:red;">Offline</span>`};
    };

    return serverConsoleCache[serverId];
}

async function saveServerCache(serverId){
    var data;
    if(!consoleData[serverId]) {
        data = {state: "Offline", console:[], htmlState: `<span style="color:red;">Offline</span>`};
    }
    else{
        var state = consoleData[serverId].state;
        var color = "yellow";
        if(state === "Online") color = "green";
        if(state === "Offline" || state === "Error") color = "red";
        consoleData[serverId].htmlState = `<span style="color:${color};">${state}</span>`
        try{
            consoleData[serverId].stats = await pidusage(consoleData[serverId].pid);
        }catch(err){}
        
        data = consoleData[serverId];
    }

    serverConsoleCache[serverId] = data;
}

async function updateServerCache(){
    for(var x in serverConsoleCache){
        saveServerCache(x);
    }

    setTimeout(()=>{
        updateServerCache();
    },500)
}