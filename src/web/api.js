const server = require("../server");
const app = server.getApp();
const projectController = require("../project/controller");
const pidusage = require("pidusage");
const projectConsole = require("../project/console");
const cors = require("cors");

app.get("/api/online", cors(), (req, res) => {
    res.json({online: true});
});

app.get("/api/console/:serverId", cors(), (req, res) => {
    var serverId = req.params.serverId;
    projectConsole.sendServerCache(serverId, res);
});

app.get("/api/stats", cors(), (req,res)=>{
    pidusage(process.pid).then((stats)=>{
        res.json(stats);
    })
});