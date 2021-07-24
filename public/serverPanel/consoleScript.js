

var serverConsole, statusMsg;
var startButton,stopButton,restartButton;
var scrolled = false;
var updateScrolled = false;
var lastConsoleMsg = 0;
var serverData;

var time = 0;
var views = 12;
var stats = [{memory:0,elapsed:0,time:0}];

window.onload = (event) => {
    serverData = JSON.parse(document.getElementById("serverData").dataset.server);
    serverConsole = document.getElementById("server-console");
    statusMsg = document.getElementById("statusMsg-id");
    startButton = document.getElementById("statusButtons-start");
    stopButton = document.getElementById("statusButtons-stop");
    restartButton = document.getElementById("statusButtons-restart");

    updateConsole();
}


function getTimestamp(){
    var d = new Date();
    return "["+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"] ";
}

async function updateConsole(){
    var req = await makeRequest();

    statusMsg.innerHTML = req.htmlState;

    if(req.state === "Offline"){
        stats.push({memory:0,cpu:0,elapsed:0,time:time});
        if(stats.length >= views) stats.shift();

        serverConsole.innerHTML = "Server is offline";

        startButton.removeAttribute("disabled", "");
        restartButton.setAttribute("disabled", "");
        stopButton.setAttribute("disabled", "");
    } else {
        if(req.state === "Starting..."){
            if(serverConsole.innerHTML === "Server is offline"){
                serverConsole.innerHTML = "";
                lastConsoleMsg = 0;
            }
        }
        req.stats.time = time;
        stats.push(req.stats);
        if(stats.length >= views) stats.shift();

        if(req.console.length > lastConsoleMsg) updateScrolled = true;
        else updateScrolled = false;

        while(req.console.length > lastConsoleMsg){
            serverConsole.innerHTML += req.console[lastConsoleMsg];
            lastConsoleMsg++;
        }

        startButton.setAttribute("disabled", "");
        restartButton.removeAttribute("disabled", "");
        stopButton.removeAttribute("disabled", "");
    }

    drawMemoryChart();
    drawCPUChart();

    if(updateScrolled) updateScroll();
    setTimeout(()=>{
        updateConsole()
        time+=500;
    }, 500);
}

async function makeRequest(){
    return await fetch(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/api/console/${serverData.id}`)
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

function updateScroll(){
    if(!scrolled){
        var element = serverConsole;
        element.scrollTop = element.scrollHeight;
    }
}

google.charts.load('current',{packages:['corechart']});
google.charts.setOnLoadCallback(drawMemoryChart);
google.charts.setOnLoadCallback(drawCPUChart);
function drawMemoryChart() {
    // Set Data
    var dataSet = [['Time', 'Memory']];
    for(var i in stats){
        var stat = stats[i];
        var ram = parseInt(stat.memory)*Math.pow(10,-6);
        var time = parseInt(stat.time)/1000;
        dataSet.push([time,ram]);
    }
    var data = google.visualization.arrayToDataTable(dataSet);

    var maxRam = 0;
    for(var i in dataSet){
        if(i == 0)continue;
        if(maxRam < dataSet[i][1]) maxRam = dataSet[i][1];
    }

    // Set Options
    var options = {
        title: 'Memory Usage',
        hAxis: {
            gridlines: {
                color: 'transparent'
            },
            viewWindow: {
                min: dataSet[0][1],
                max: time
            },
            textPosition: 'none'
        },
        vAxis: {
            title: 'Memory',
            viewWindow: {
                min: 0,
                max: Math.ceil(maxRam)+1.5
            }
        },
        legend: 'none',
        backgroundColor: '#2c2c2c',
        series: {
            0: {tooltip : false}
        }
    };

    // Draw Chart
    var chart = new google.visualization.AreaChart(document.getElementById('chart-ram'));
    chart.draw(data, options);
}

function drawCPUChart() {
    // Set Data
    var dataSet = [['Time', 'CPU']];
    for(var i in stats){
        var stat = stats[i];
        var ram = parseInt(stat.cpu);
        var time = parseInt(stat.time)/1000;
        dataSet.push([time,ram]);
    }
    var data = google.visualization.arrayToDataTable(dataSet);

    var maxCpu = 0;
    for(var i in dataSet){
        if(i == 0)continue;
        if(maxCpu < dataSet[i][1]) maxCpu = dataSet[i][1];
    }

    // Set Options
    var options = {
        title: 'CPU Usage',
        hAxis: {
            gridlines: {
                color: 'transparent'
            },
            viewWindow: {
                min: dataSet[0][1],
                max: time
            },
            textPosition: 'none'
        },
        vAxis: {
            title: 'CPU',
            viewWindow: {
                min: 0,
                max: Math.ceil(maxCpu)+1
            }
        },
        legend: 'none',
        backgroundColor: '#2c2c2c',
        series: {
            0: {tooltip : false}
        }
    };

    // Draw Chart
    var chart = new google.visualization.AreaChart(document.getElementById('chart-cpu'));
    chart.draw(data, options);
}