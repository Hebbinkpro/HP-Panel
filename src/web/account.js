const server = require("../server");
const app = server.getApp();
const {encrypt} = require("../security/crypto");
const loginManager = require("../account/login");
const accountController = require("../account/controller")
const utils = require("../utils/web")
const projectController = require("../project/controller")
const {getServerCache} = require("../project/console");

app.get("/login", (req,res)=>{
    res.render("account/login.ejs", {msg:utils.getUrlMsg(req)})
});

app.post("/login", (req,res)=>{
    var body = req.body;
    var password = encrypt(body.password);
    var user = body.username;

    accountController.login(user,password).then((output)=>{
        if(typeof output === "string"){
            utils.setUrlMsg(req,"/login",output,"red");
            res.redirect("/login")
            return;
        }

        var sessionId = loginManager.createSession(output);
        res.cookie("account", sessionId);
        res.redirect("/");
    });
})

app.get("/login/register", (req,res)=>{
    res.render("account/register.ejs", {msg:utils.getUrlMsg(req)});
});

app.post("/login/register", (req,res)=>{
    var body = req.body;
    var email = body.email;
    var password = JSON.stringify(encrypt(body.password));
    var confirmPassword = JSON.stringify(encrypt(body['password?']));
    var username = body.username;

    if(password !== confirmPassword){
        utils.setUrlMsg(req,"/login/register","Passwords are not the same","red");
        res.redirect("/login/register");
        return;
    }

    accountController.register(email,username,password).then((output)=>{
        if(typeof output === "string"){
            utils.setUrlMsg(req,"/login/register",output,"red");
            res.redirect("/login/register");
            return;
        }

        res.redirect("/login");
    })
});

app.get("/logout", (req,res)=>{
    var sessionId = loginManager.getSessionId(req.cookies);
    loginManager.destorySession(sessionId);

    res.redirect("/");
});

app.get("/account", (req,res)=>{
    var acc = req.session.account;
    getProjects(acc.id).then((projects)=>{
        acc.projects = projects;
        res.render("account.ejs", {msg:utils.getUrlMsg(req),account:acc})
    });
});

async function getProjects(userId){
    var projectList = {};
    var projects = await projectController.getFromUser(userId);

    for(var x in projects){
        var project = projects[x];

        if(project.approved == 0) continue;

        var status = await getServerCache(project.id)
        project.status = status.state;

        projectList[project.id] = project;
    }

    return projectList;
}