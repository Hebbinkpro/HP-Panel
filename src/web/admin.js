const server = require("../server");
const app = server.getApp();
const {encrypt} = require("../security/crypto");
const accountController = require("../account/controller");
const projectController = require("../project/controller");
const {getServerCache} = require("../project/console");
const utils = require("../utils/web");
const dbManager = require("../databaseManager");
const fs = require("fs");
const submissionUtils = require("../utils/submission");
const fileUtils = require("../utils/file")

app.get("/admin", (req,res)=>{
    accountController.getAll().then((accounts)=>{
        projectController.getAll().then(projects=>{
            var submissions = 0;
            var inactive = 0;
            var active = 0;
            for(var x in projects){
                var project = projects[x];
                if(project.approved == 0) {
                    submissions++;
                    continue;
                }
                if(project.active == 0) {
                    inactive++;
                    continue;
                }
                active++;
            }

            var stats = {
                users:accounts.length,
                projects: {
                    active: active,
                    inactive: inactive,
                    total: active+inactive
                },
                submissions:submissions
            }
        
            res.render("admin/index.ejs", {account:req.session.account,stats:stats,msg:utils.getUrlMsg(req)});
        })
    })
});

// USERS
app.get("/admin/users", (req,res)=>{
    dbManager.all("SELECT * FROM accounts").then((data)=>{
        res.render("admin/user/index.ejs",{account: req.session.account, accounts: data, msg: utils.getUrlMsg(req)})
    })
});

app.get("/admin/users/:userId", (req,res)=>{
    var userId = parseInt(req.params.userId);
    accountController.getById(userId).then((user)=>{
        if(user === undefined){
            utils.setUrlMsg(req,"/admin/users","404: Couldn't find this user", "red");
            res.redirect("/admin/users");
        }
        projectController.getFromUser(user.id).then((projects)=>{
            user.projects = projects;
            res.render("admin/user/user.ejs", {account: req.session.account, user: user, msg: utils.getUrlMsg(req)});
        });
    })
});

app.post("/admin/users/:userId", (req,res)=>{
    var userId = parseInt(req.params.userId);
    var body = req.body;
    var acc = req.session.account;

    if(body.confirmDelete){
        body.action = "delete";
    }

    accountController.getById(userId).then(user=>{
        if(user === undefined){
            utils.setUrlMsg(req,"/admin/users","404: Couldn't find this user","red");
            res.status(404).redirect("/admin/users");
            return;
        }

        if(acc.admin < 2){
            utils.setUrlMsg(req,"/admin/users/"+userId,"You don't have the permission to manage accounts!","red");
            res.redirect("/admin/users/"+userId);
            return;
        }

        var action = body.action;
        
        if(body.confirmDelete == "yes") action = "delete";

        if(action === "delete"){
            if(acc.id == userId){
                utils.setUrlMsg(req,"/admin/users/"+userId,"You can't delete your own account!","red");
                res.redirect("/admin/users/"+userId);
                return;
            }

            if(!body.confirmDelete){
                res.send(`Do you want to delete this user?<br><br> 
                    <form method="POST" action="/admin/users/${userId}">
                        <button name="confirmDelete" value="yes">Yes</button>
                    </form>
                    <form method="POST" action="/admin/users/${userId}">
                        <button name="confirmDelete" value="no">No</button>
                    </form>
                `);
                return;
            }
            if(body.confirmDelete === "yes"){
                accountController.remove(userId);
                utils.setUrlMsg(req,"/admin/users",`User with id '${user.id}' removed`,"green");
                res.redirect("/admin/users");
                return;
            }
            else{
                res.redirect("/admin/users/"+userId)
            }
        }
        if(action === "setAdmin"){
            if(acc.id == userId){
                utils.setUrlMsg(req,"/admin/users/"+userId,"You can't demote your own account!","red");
                res.redirect("/admin/users/"+userId);
                return;
            }

            
            accountController.getAdmins().then(admins=>{
                if(admins.length <= 1){
                    utils.setUrlMsg(req,"/admin/users/"+userId,"It isn't possible to have less than 1 admin account!","red");
                    res.redirect("/admin/users/"+userId);
                    return;
                }

                var admin = user.admin == 0 ? 1 : 0;
                utils.setUrlMsg(req,"/admin/users/"+userId,`${admin == 1 ? "Added admin perms to" : "Removed admin perms from"} user '${user.id}'`,"green");
                accountController.setAdmin(userId, admin);
                res.redirect("/admin/users/"+userId);
            })

            
        }
    });
})

// SUBMISSIONS
app.get("/admin/submissions", (req,res)=>{
    projectController.getSubmissions().then((submissions)=>{
        var content = [];
        for(var x in submissions){
            var submission = submissions[x];
            var files = fs.readdirSync(`${process.cwd()}/data/submissions/${submission.id}`);

            if(!files.includes("content.json")) continue;
            var data = fs.readFileSync(`${process.cwd()}/data/submissions/${submission.id}/content.json`);
            content.push(JSON.parse(data));
        }
        content.sort((a,b)=>{
            return a.time - b.time;
        });
        res.render("admin/submission/index.ejs", {account: req.session.account, submissions:content, msg: utils.getUrlMsg(req)});
    });
});

app.get("/admin/submissions/:submissionId", (req,res)=>{
    var submissionId = req.params.submissionId;

    var folders = fs.readdirSync(`${process.cwd()}/data/submissions/`);

    if(!folders.includes(`${submissionId}`)) {
        utils.setUrlMsg(req,"/admin/submissions","404: Couldn't find this submission", "red");
        res.redirect("/admin/submissions");
        return;
    }

    projectController.getSubmissions().then(submissions=>{
        var found = false;
        for(var x in submissions){
            var sub = submissions[x];
            if(sub.id == submissionId){
                found = true;
                break;
            }
        }

        if(!found){
            utils.setUrlMsg(req,"/admin/submissions","404: Couldn't find this submission", "red");
            res.redirect("/admin/submissions");
            return;
        }
        
        var data = fs.readFileSync(`${process.cwd()}/data/submissions/${submissionId}/content.json`);
        var content = JSON.parse(data);
    
        accountController.getById(content.account).then(acc=>{
            content.account = acc;
            res.render("admin/submission/submission.ejs", {account: req.session.account, submission:content, msg: utils.getUrlMsg(req)});
        });
    });
});

app.post("/admin/submissions/:submissionId/action", (req,res)=>{
    var submissionId = req.params.submissionId;
    var type = req.body.type;

    projectController.exists(submissionId).then(projectExists =>{
        if(!projectExists){
            //error
            return;
        };

        if(type === "approve"){
            
            submissionUtils.approve(submissionId).then(output=>{
                if(!output){
                    utils.setUrlMsg(req,"/admin/submissions", "Submission does not exists", "red");
                    res.redirect("/admin/submissions");
                    return;
                }

                projectController.approve(submissionId);
                utils.setUrlMsg(req,"/admin/submissions", "Server approved", "green");
                res.redirect("/admin/submissions");
            })
            
        }
        if(type === "reject"){
            utils.setUrlMsg(req,"/admin/submissions", "Server rejected", "green");
            projectController.remove(submissionId);
            submissionUtils.reject(submissionId);
            res.redirect("/admin/submissions")
        }
    });
});

// PROJECTS
app.get("/admin/projects", (req,res)=>{
    getProjects().then(projects=>{
        res.render("admin/project/index.ejs", {account: req.session.account, projects: projects, msg: utils.getUrlMsg(req)});
    });
});

app.get("/admin/projects/:projectId", (req,res)=>{
    var projectId = parseInt(req.params.projectId);

    projectController.getById(projectId).then(project=>{
        if(project === null){
            utils.setUrlMsg(req,"/admin/projects","404: Couldn't find this project","red");
            res.status(404).redirect("/admin/projects");
            return;
        }

        getProjects().then((projects)=>{
            res.render("admin/project/project.ejs",{account: req.session.account, project: projects[projectId], msg: utils.getUrlMsg(req)})
        });
    });
})

app.post("/admin/projects/:projectId", (req,res)=>{
    var projectId = parseInt(req.params.projectId);
    var body = req.body;
    var acc = req.session.account;

    if(body.confirmDelete){
        body.action = "delete";
    }

    projectController.getById(projectId).then(project=>{
        if(project === null){
            utils.setUrlMsg(req,"/admin/projects","404: Couldn't find this project","red");
            res.status(404).redirect("/admin/projects");
            return;
        }

        var action = body.action;
        if(action === "delete"){
            if(acc.admin < 2){
                utils.setUrlMsg(req,"/admin/users/"+userId,"You don't have the permission to delete projects!","red");
                res.redirect("/admin/users/"+userId);
                return;
            }

            if(!body.confirmDelete){
                res.send(`Do you want to delete this project?<br><br> 
                    <form method="POST" action="/admin/projects/${projectId}">
                        <button name="confirmDelete" value="yes">Yes</button>
                    </form>
                    <form method="POST" action="/admin/projects/${projectId}">
                        <button name="confirmDelete" value="no">No</button>
                    </form>
                `);
                return;
            }
            if(body.confirmDelete === "yes"){
                projectController.remove(projectId);
                utils.setUrlMsg(req,"/admin/projects",`Project with id '${project.id}' removed`,"green");
                res.redirect("/admin/projects");
                fileUtils.moveFolder(`${process.cwd()}/projects/${project.id}`,`${process.cwd()}/data/deleted/${project.id}`);
                fileUtils.removeFolder(`${process.cwd()}/data/projects/${project.id}`)
                return;
            }
            else{
                res.redirect("/admin/projects/"+projectId)
            }
        }
        if(action === "setActive"){
            var active = project.active == 0 ? true : false;
            utils.setUrlMsg(req,"/admin/projects/"+projectId,`${active==true ? "Activated" : "Deactivated"} Project with id '${project.id}'`,"green");
            projectController.setActive(projectId, active);
            res.redirect("/admin/projects/"+projectId);
        }
    });
})

async function getProjects(){
    var projectList = {};
    var projects = await projectController.getAll();

    for(var x in projects){
        var project = projects[x];

        if(project.approved == 0) continue;

        var ownerId = project.owner;
        var owner = await accountController.getById(ownerId)
        project.owner = owner;

        var status = await getServerCache(project.id)
        project.status = status.state;

        projectList[project.id] = project;
    }

    return projectList;
}