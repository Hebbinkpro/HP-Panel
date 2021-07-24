const db = require("../databaseManager");

async function setup(){
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        startFile TEXT,
        owner INTEGER,
        members TEXT,
        approved INTEGER,
        active INTEGER)`);
}

async function submit(name, userId, startFile = "index.js"){
    return await create(name, userId, startFile, [], 0, 1);
}

async function create(name, userId, startFile, members, approved, active){
    var res = await db.run(`INSERT INTO 
        projects(name,startFile,owner,members,approved,active) 
        VALUES (?,?,?,?,?,?)`,
        [name,startFile,userId,JSON.stringify(members),approved,active]);

    return res.id;
}

async function approve(id, approved=true){
    if(!await exists(id)) return;

    if(!approved) approved = 0;
    else approved = 1;

    return await db.run(`UPDATE projects SET approved = ? WHERE id = ?`, [approved,id]);
}

async function setActive(id, active=true){
    if(!await exists(id)) return;

    if(!active) active = 0;
    else active = 1;

    return await db.run(`UPDATE projects SET active = ? WHERE id = ?`, [active,id]);  
}

async function setStartFile(id, file){
    if(!await exists(id)) return;

    return await db.run(`UPDATE projects SET startFile = ? WHERE id = ?`, [file,id]);  
}

async function exists(id){
    var res = await db.get("SELECT COUNT(*) AS amount FROM projects WHERE id = ?",[id]);

    if(res.amount > 0) return true;
    return false;
}

async function remove(id){
    if(!await exists(id)) return;

    return await db.run(`DELETE FROM projects WHERE id = ?`, [id]);  
}

async function getById(id){
    if(!await exists(id)) return null;

    return await db.get("SELECT * FROM projects WHERE id = ?", [id]);
}

async function getByName(name){
    return await db.all("SELECT * FROM projects WHERE name = ?", [name]);
}

async function getFromUser(userId){
    return await db.all("SELECT * FROM projects WHERE owner = ? ", [userId]);
}

async function getAll(){
    return await db.all("SELECT * FROM projects");
}

async function getSubmissions(){
    return await db.all("SELECT * FROM projects WHERE approved = 0");
}

module.exports = {
    setup,
    create,
    submit,
    approve,
    setActive,
    getByName,
    exists,
    getById,
    getByName,
    getFromUser,
    getAll,
    getSubmissions,
    setStartFile,
    remove
}