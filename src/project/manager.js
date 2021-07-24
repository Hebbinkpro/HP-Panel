const child_process = require("child_process");
const projectController = require("./controller");
const {saveServerCache,consoleData} = require("./console")
const projectPath = process.cwd()+"/projects";
const logger = require("../utils/logger");
const system = require("../utils/system")

const processes = {};

async function createServer(project){
    if(process.platform === "linux"){
        return child_process.spawn(
            'sh', 
            ['-c',`cd ${projectPath}/${project.id} && echo npm install && npm install && node ${project.startFile}`], 
            {
                stdio: ['pipe', 'pipe', 'pipe'], 
                detached: true,
                cwd: `${projectPath}/${project.id}`
            }
        );
    }
    if(process.platform === "win32"){
        return child_process.spawn(
            `cd ${projectPath}/${project.id} && echo npm install && npm install && node ${project.startFile}`,
            [],
            {
                stdio: ['pipe', 'pipe', 'pipe'], 
                detached: false, 
                shell: true,
                cwd: `${projectPath}/${project.id}`
            }
        );
    }

    logger.error("No startup command found for this Operating System");
    return null;
}


async function startServer(projectId){
    if(processes[projectId]) return;

    if(!await projectController.exists(projectId)) return;

    var project = await projectController.getById(projectId);

    var server = await createServer(project);
    logger.debug("Started project with PID: " + server.pid);

    if(server === null){
        logger.warn(`It isn't possible to start projects on this Operating System, please use a supported OS (${system.supported})`);
        logger.error(`Couldn't start project: ${project.id}`)
        return;
    }

    server.stdin.setEncoding('utf-8');

    processes[projectId] = server;
    consoleData[projectId] = {state: "Starting...", console: ["Staring server...\r\n<br>"], pid: server.pid};
    saveServerCache(projectId);
    
    var sd = [];
    
    server.stdout.on("data", (data) => {
        var output = data.toString();
        sd.push(data.toString());

        let serverData = consoleData[projectId];
        if(output.toLowerCase().indexOf("online") > -1) serverData.state = "Online";

        let line = getLines(output);
        serverData.pid = server.pid;

        serverData.console.push(line);
    });
}

function getLines(output){
    if(output.indexOf("\r\n[") > -1){
        let lines = output.split("\r\n");

        output = "";
        for(let i=0; i<lines.length;i++){
            output += styleLine(lines[i]);
        } 
    } else {
        output = styleLine(output);
    }
    //return output+"<br>";
    return output;
}

function styleLine(line){
    color = "white";
    if(line.indexOf("NOTICE") > -1) color = "lightblue";
    if(line.indexOf("WARNING") > -1) color = "yellow";
    if(line.indexOf("ERROR") > -1) color = "red";
    if(line.indexOf("CRITICAL") > -1) color = "red";
    if(line.indexOf("EMERGENCY") > -1) color = "red";

    return `<span style="color:${color}">${line}</span><br>`;
}

function stopServer(projectId){
    if(!processes[projectId]) return;

    let serverData = consoleData[projectId];
    serverData.state = "Stopping...";
    serverData.console.push("Stopping the server...\r\n");

    let server = processes[projectId];
    server.stdin.end();
    
    setTimeout(()=> {
        try{
            process.kill(-server.pid);
        }catch(err){
            try{
                process.kill(server.pid);
            } catch(err){
                logger.error(err);
            }
        }
        
        consoleData[projectId] = {state: "Offline", console: ["The server is offline\r\n"]}
        delete processes[projectId];
    },3000);
}

function restartServer(projectId){
    stopServer(projectId);
    setTimeout(()=>{
        startServer(projectId);
    }, 5000);
}

function sendCommand(command, projectId){
    command+="\r\n"
    if(!processes[projectId]) return;
    let server = processes[projectId];
    consoleData[projectId].console.push(command+"<br>");
    server.stdin.write(command);
}

function isActive(projectId){
    var active = projects[projectId].active;
    var approved = projects[projectId].approved;

    if(!active || !approved) return false;

    return true;
}

module.exports = {
    consoleData,
    startServer,
    stopServer,
    getLines,
    restartServer,
    sendCommand
}
