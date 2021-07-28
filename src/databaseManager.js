const sqlite3 = require("sqlite3");
var db;

function run(sql,params=[]){
    if(!db){
        console.warn("Not connected to the database");
        return;
    }
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error('Error running sql ' + sql)
                console.error(err)
                reject(err)
            } else {
                resolve({ id: this.lastID })
            }
        })
    })
}
function get(sql,params=[]){
    if(!db){
        console.warn("Not connected to the database");
        return;
    }
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            if (err) {
                console.error(' Error running sql: ' + sql)
                console.error(err)
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}
function all(sql,params=[]){
    if(!db){
        console.warn("Not connected to the database");
        return;
    }
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, result) => {
            if (err) {
                console.error(' Error running sql: ' + sql)
                console.error(err)
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}
async function connect (){
    db = new sqlite3.Database("./data/database.sqlite3", (err)=>{
        if(err) {
            console.error("Could not connect to the database");
            console.error(err);
        }
        else console.info("Connected to the database");
    });
}

module.exports = {
    run,
    get,
    all,
    connect
}