const sqlite3 = require("sqlite3");
const logger = require("./utils/logger")
var db;

function run(sql,params=[]){
    if(!db){
        logger.warn("Not connected to the database");
        return;
    }
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                logger.error('Error running sql ' + sql)
                logger.error(err)
                reject(err)
            } else {
                resolve({ id: this.lastID })
            }
        })
    })
}
function get(sql,params=[]){
    if(!db){
        logger.warn("Not connected to the database");
        return;
    }
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            if (err) {
                logger.error(' Error running sql: ' + sql)
                logger.error(err)
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}
function all(sql,params=[]){
    if(!db){
        logger.warn("Not connected to the database");
        return;
    }
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, result) => {
            if (err) {
                logger.error(' Error running sql: ' + sql)
                logger.error(err)
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
            logger.emergency("Could not connect to the database");
            logger.emergency(err);
        }
        else logger.info("Connected to the database");
    });
}

module.exports = {
    run,
    get,
    all,
    connect
}