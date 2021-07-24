const { decrypt } = require("../security/crypto");
const db = require("../databaseManager");

async function setup(){
    var res = await db.run(`CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        username TEXT,
        password TEXT,
        admin INTEGER,
        servers TEXT)`);
}

async function create(email,username,password,servers="[]"){
    var res = await exists(email);
    if(res) return;

    return await db.run(
        "INSERT INTO accounts (email,username,password,admin,servers) VALUES (?,?,?,?,?)", 
        [email.toLowerCase(),username,password,0,servers]);
}

async function exists(email){
    var res = await db.get("SELECT COUNT(*) AS amount FROM accounts WHERE email = ?",[email.toLowerCase()]);

    if(res.amount > 0) return true;
    return false;
}

async function getById(id){
    var res = await db.get("SELECT * FROM accounts WHERE id = ?",[id]);
    return res;
}

async function getByEmail(email){
    var res = await db.get("SELECT * FROM accounts WHERE email = ?",[email.toLowerCase()]);
    return res;
}

async function getByUsername(username){
    var res = await db.get("SELECT * FROM accounts WHERE LOWER(username) = ?",[username.toLowerCase()]);
    return res;
}

async function getAccount(user){
    var acc = await getByEmail(user);
    if(acc === undefined) acc = await getByUsername(user);
    if(acc === undefined) return null;

    return acc;
}

async function login(user, password){
    var acc = await getAccount(user);
    if(acc === null) return "Account not found";

    if(decrypt(password) !== decrypt(JSON.parse(acc.password))) return "Password incorrect";

    return acc;
}

async function register(email,username,password){
    var acc = await getByEmail(email);
    if(acc !== undefined) return "Acount with this email exists"

    acc = await getByUsername(username);
    if(acc !== undefined) return "Account with this username exists";

    create(email,username,password);
    return null;
}

async function setAdmin(id,set=1){
    return await db.run("UPDATE accounts SET admin = ? WHERE id = ?", [set,id]);
}

async function getAdmins(){
    return await db.get("SELECT * FROM accounts WHERE admin >= ?",[1]);
}

async function getAll(){
    return await db.all("SELECT * FROM accounts");
}

async function remove(id){
    if(!await exists(id)) return;

    return await db.run(`DELETE FROM accounts WHERE id = ?`, [id]);  
}

module.exports = {
    setup,
    create,
    exists,
    getById,
    getByEmail,
    getByUsername,
    login,
    register,
    setAdmin,
    getAll,
    getAdmins,
    remove
}