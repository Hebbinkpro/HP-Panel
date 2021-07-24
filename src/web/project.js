const server = require("../server");
const app = server.getApp();
const {encrypt} = require("../security/crypto");
const loginManager = require("../account/login");
const projectController = require("../project/controller");
const projectManager = require("../project/manager")
const utils = require("../utils/web");

app.all("/console/:serverId*", (req,res,next)=>{
    var serverId = req.params.serverId;

    var acc = req.session.account;
    var myServers = JSON.parse(acc.servers);



    if(acc.admin == 0){

        if(!myServers.includes(server.id)){
            utils.setUrlMsg(req,"/console","403: No permission","red")
            res.status(403).redirect("/console");
            return;
        }
    }


    projectController.exists(serverId).then(projectExists=>{
        if(!projectExists){
            utils.setUrlMsg(req,"/console","404: Couldn't find this project","red")
            res.status(404).redirect("/console");
            return;
        }

        next();
    });
});

app.get("/console/:serverId", (req,res) => {
    var serverId = req.params.serverId;

    projectController.getById(serverId).then(server=>{
        var acc = req.session.account;
        res.render("panel/console.ejs", {server: server, account:acc,msg: utils.getUrlMsg(req)});
    });
})

app.post("/console/:serverId/action", (req,res) => {
    var serverId = req.params.serverId;
    var body = req.body;

    projectController.getById(serverId).then(server=>{
        if(server.approved == 0 || server.active == 0){
            res.redirect("/console/"+serverId);
            return;
        }
    
        if(body.type === "start"){
            projectManager.startServer(serverId)
            res.redirect("/console/"+serverId);
        }
        else if(body.type === "stop"){
            projectManager.stopServer(serverId)
            res.redirect("/console/"+serverId);
        }
        else if(body.type === "restart"){
            projectManager.restartServer(serverId);
            res.redirect("/console/"+serverId);
        }
        else {
            res.redirect("/console/"+serverId);
        }
    })
})

app.post("/console/:serverId/sendCommand", (req,res) => {
    var body = req.body;
    var serverId = req.params.serverId;

    projectManager.sendCommand(body.command, serverId);

    res.redirect("/console/"+serverId);
});