const server = require("../server");
const app = server.getApp();
const {encrypt} = require("../security/crypto");
const loginManager = require("../account/login");
const projectController = require("../project/controller");
const utils = require("../utils/web");
const formidable = require("formidable");
const fs = require("fs");
const submissionUtils = require("../utils/submission");
const fileUtils = require("../utils/file");

app.get("/console", (req,res) => {
    var acc = req.session.account;

    if(acc.admin == 0){
        projectController.getFromUser(acc.id).then(servers => {
            res.render("panel/index.ejs", {servers: servers, account: acc, msg: utils.getUrlMsg(req)});
        });
    }
    else {
        projectController.getAll().then(servers =>{
            res.render("panel/index.ejs", {servers: servers, account: acc, msg: utils.getUrlMsg(req)});
        });
    }
});

app.get("/createServer", (req,res)=>{
    var acc = req.session.account;
    res.render("panel/createServer.ejs", {account:acc,msg: utils.getUrlMsg(req)})
});

app.post("/createServer", (req,res)=>{
    var form = new formidable.IncomingForm({uploadDir: process.cwd()+"/data/tmp"});
    
    form.parse(req, (err,fields,files)=>{
        if(err){
            console.log(err);
            utils.setUrlMsg(req,"/createServer","Something went wrong: 0","red");
            res.redirect("/createServer");
            return;
        }

        var userId = loginManager.getSession(req.cookies);

        while(fields.name.indexOf(" ") > -1){
            fields.name = fields.name.replace(" ", "-");
        }

        projectController.submit(fields.name, userId, fields.startFile).then((submissionId)=>{
            var oldpath = files.file.path;
            var newpath = `${process.cwd()}/data/submissions/${submissionId}/${fields.name}.zip`;
    
            fs.access(`${process.cwd()}/data/submissions/${submissionId}`, (err)=>{
                if(err) {
                    fs.mkdir(`${process.cwd()}/data/submissions/${submissionId}`, (err)=>{
                        if(err) {
                            console.log(err);
                            utils.setUrlMsg(req,"/createServer","Something went wrong: 1","red");
                            res.redirect("/createServer");
                            projectController.remove(submissionId);
                            return;
                        }

                        fs.rename(oldpath,newpath, (err)=>{
                            if(err) {
                                console.log(err);
                                utils.setUrlMsg(req,"/createServer","Something went wrong: 2","red");
                                res.redirect("/createServer");
                                projectController.remove(submissionId);
                                return;
                            }

                            fileUtils.unzip(`${process.cwd()}/data/submissions/${submissionId}`, `${fields.name}.zip`, (args)=>{
                                var submissionId = args[0];
                                var userId = args[1];
                                var fields = args[2];
                                var req = args[3];
                                var res = args[4];

                                submissionUtils.checkUnzipOutput(submissionId).then(startFilePath =>{
                                    if(!startFilePath || startFilePath === null){
                                        utils.setUrlMsg(req,"/createServer","Start file not found!","red");
                                        res.redirect("/createServer");
                                        projectController.remove(submissionId);
                                        return;
                                    }

                                    var startFile = startFilePath.replace(`${process.cwd()}/data/submissions/${submissionId}/output/`, "");
                                    projectController.setStartFile(submissionId, startFile)

                                    var content = {
                                        "id": submissionId,
                                        "name": fields.name,
                                        "time": new Date().getTime(),
                                        "desc": fields.desc,
                                        "account": userId,
                                        "startFile": startFile
                                    }

                                    fs.writeFile(`${process.cwd()}/data/submissions/${submissionId}/content.json`, JSON.stringify(content,0,4), (err)=>{
                                        if(err){
                                            console.log(err);
                                            utils.setUrlMsg(req,"/createServer","Something went wrong: 4","red");
                                            res.redirect("/createServer");
                                            projectController.remove(submissionId);
                                            return;
                                        }
                        
                                        utils.setUrlMsg(req,"/console","Your project is submitted","green")
                                        res.redirect("/console");
                                    });
                                });

                            }, [submissionId,userId,fields,req,res]);
                        });
                    });
                }
                else{
                    utils.setUrlMsg(req,"/createServer","This project is already created, please try again","red");
                    res.redirect("/createServer");
                    return;
                }
            });
        })
    });
});