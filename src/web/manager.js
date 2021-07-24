const server = require("../server");
const express = require("express");
const app = server.getApp();
const fs = require("fs");
const logger = require("../utils/logger");

const pages = {};

const loginManager = require("../account/login");
const accountController = require("../account/controller");
const utils = require("../utils/web");

app.use((req,res,next)=>{

    if(req.url.startsWith("/api")){
        next();
        return;
    }

    if(!req.session.msg) req.session.msg = {};
    for(var x in req.session.msg){
        if(req.url !== x) {
            delete req.session.msg[x];
        } else {
            req.session.msg[x].uses ++;
            if(req.session.msg[x].uses >= req.session.msg[x].maxUses){
                delete req.session.msg[x];
            }
        }
    }

    var loginId = loginManager.getSession(req.cookies);

    if(loginId === null){ // not logged in
        if(!loginManager.allowedUrl(req.url)) res.redirect("/login");
        else next();
        return;
    }

    accountController.getById(loginId).then((acc)=>{
        if(acc === undefined){ // account doesn't exists
            if(!loginManager.allowedUrl(req.url)) res.redirect("/login");
            else next();
            return;
        }
        req.session.account = acc;
    
        if(!loginManager.allowedUrl(req.url, true, acc.admin)) {
            setUrlMsg(req,"/console","403: No permission","red");
            res.redirect("/console");
        }
        else next();
    });
});

app.get("/", (req,res)=>{

    var session = loginManager.getSession(req.cookies);
    if(session !== null){
        res.redirect("/console");
        return;
    }

    res.redirect("/login");
})

register();

async function register(){
    var files = fs.readdirSync(__dirname);
    for(var x in files){
        var file = files[x];
        if(file === "manager.js") continue;

        var fileName = file.split(".").slice(0,-1).join(".");
        pages[fileName] = require(`./${file}`);

        logger.info("Loaded web module: " + fileName)
    }
}

module.exports = {
    register
}