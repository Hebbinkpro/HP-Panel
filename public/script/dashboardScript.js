var serverElement;
var serverData;
var elements = [];

window.onload = (event) => {
    serverElement = document.getElementById("servers");
    serverData = JSON.parse(serverElement.dataset.servers);
    checkServerStats();
}

function checkServerStats(){
    /*for(var x in servers){
        var server = servers[x];
        console.log(server.id)
        elements[server.id] = 
        getServerStatus(server);
    }*/
    
    for(var x in serverData){
        var server = serverData[x];
        elements[server.id] = document.getElementById("serverBoxStatus-"+server.id);
        getServerStatus(server);
    }

    setTimeout(function(){
        checkServerStats();
    }, 1000);
}

async function getServerStatus(server){
    var serverBoxStatus = elements[server.id];

    var req = await makeRequest(server);
    serverBoxStatus.innerHTML = req.htmlState;
}

async function makeRequest(server){
    return await fetch(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/api/console/${server.id}`)
    .then(res => {
        if(!res.ok){
            return {state: "Connection Error", htmlState: `<span style='color:red;'>Connection Error</span>`}
        }
        return res.json();
    })
    .then(data => {
        return data;
    })
    .catch(err => {
        return {state: "Connection Error", htmlState: `<span style='color:red;'>Connection Error</span>`}
    })
}

function goToServer(serverId){

    window.location.href = `http://${window.location.host}/console/${serverId}`
}