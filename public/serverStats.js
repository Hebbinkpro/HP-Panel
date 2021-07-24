var stats = [{memory:0,cpu:0,time:0}];
var views = 12;
var time = 0;

window.onload = (event) => {
    updateStats();
}

async function updateStats(){
    var req = await makeRequest();

    if(req.state === "Connection Error"){
        stats.push({memory:0,cpu:0,elapsed:0,time:time});
        if(stats.length >= views) stats.shift();
    } else {
        req.time = time;
        stats.push(req);
        if(stats.length >= views) stats.shift();
    }

    drawMemoryChart();
    drawCPUChart();

    setTimeout(()=>{
        updateStats()
        time+=500;
    }, 500);
}

async function makeRequest(){
    return await fetch(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/api/stats`)
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
                max: Math.ceil(maxRam)+maxRam*0.25
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
                max: Math.ceil(maxCpu)+maxCpu*0.25
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