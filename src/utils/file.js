const fs = require("fs");
const unzipper = require("unzipper");
const logger = require("./logger");

async function unzip(path, file, callback=null, callbackArgs=[]){
    var unzipPath = path+"/output";

    try {
        fs.readdirSync(unzipPath);
    } catch (err) {
        try{
            fs.mkdirSync(unzipPath);
        } catch(err){
            logger.debug(err);
        }
    }


    var fileContents = fs.createReadStream(`${path}/${file}`);
    fileContents.pipe(unzipper.Parse()).on('entry', entry=>{
        var filePath = entry.path;
        var type = entry.type; // 'Directory' or 'File'

        if (type === "File") {
            var pathFolders = filePath.split("/")
            if(pathFolders.length > 1){
                for(var i=0;i<pathFolders.length-1;i++){// -1 because the last element is a file
                    var folder = pathFolders[i];
                    var folderPath = "";
                    for(var j=0;j<i;j++){
                        folderPath = folderPath + "/" + pathFolders[j];
                    }
                    folderPath = folderPath + "/" + folder;
                    try {
                        fs.readdirSync(`${unzipPath}/${folderPath}`);
                    } catch(err) {
                        try{
                            fs.mkdirSync(`${unzipPath}/${folderPath}`);
                        } catch(err){
                            logger.debug(err);
                        }
                    }
                }
            }

            entry.pipe(fs.createWriteStream(`${unzipPath}/${filePath}`));
        }
    }).promise().then(()=>{
        logger.debug("Unzipped " + path + "/" + file);
        if(callback instanceof Function){
            callback(callbackArgs)
        }
    })
}

async function checkForFile(path, searchFile){
    var files = [];
    try{
        files = fs.readdirSync(path);
    } catch(err){
        logger.debug(err);
        return null;
    }

    var folders = [];
    for(var x in files){
        var f = files[x];
        var fileData = fs.lstatSync(`${path}/${f}`);

        if(fileData.isDirectory()) {
            folders.push(f);
            continue;
        }

        if(f === searchFile) {
            //console.log("File found: ", `${path}/${f}`);
            return `${path}/${f}`
        };
    }

    for(var y in folders){

        var filePath = await checkForFile(`${path}/${folders[y]}`, searchFile);
        if(filePath !== false || filePath !== null) return filePath;
    }
    
    return false;
}

async function getFiles(path){
    var files = [];
    try{
        files = fs.readdirSync(path);
    } catch(err){
        logger.debug(err);
        return null;
    }

    var fileList = [];

    for(var x in files){
        var f = files[x];
        var fileData = fs.lstatSync(`${path}/${f}`);

        var fileData = {name: f, dir: fileData.isDirectory()};
        fileList.push(fileData);
    }

    return fileList;
}

async function moveFolder(path, destPath){
    await copyFolder(path, destPath);
    await removeFolder(path);

    logger.debug("Moved " + path + " to " + destPath);
}

async function removeFolder(path){
    try{
        fs.readdirSync(path);
    } catch(err){
        logger.debug(err);
        return;
    }

    var files = await getFiles(path);
    
    for(var x in files){
        var file = files[x];
        if(file.dir){
            await removeFolder(`${path}/${file.name}`);
            continue;
        }

        try{
            fs.rmSync(`${path}/${file.name}`);
        }catch(err){
            if(err){
                logger.error(err);
            }
        }
    }

    try{
        fs.rmdirSync(path)
    }catch(err){
        if(err){
            logger.error(err);
        }
    }
    logger.debug("Removed " + path);
    return;
}

async function copyFolder(path, destPath){
    try{
        fs.readdirSync(destPath);
    } catch(err){
        try{
            fs.mkdirSync(destPath);
        } catch(err){
            logger.debug(err);
        }
    }

    var files = await getFiles(path);
    
    var folders = [];
    for(var x in files){
        var file = files[x];
        if(file.dir){
            folders.push(file);
            continue;
        }
    
        fs.copyFile(`${path}/${file.name}`, `${destPath}/${file.name}`, (err)=>{
            if(err){
                logger.error(err);
                return;
            }
        })
    }

    for(var y in folders){
        var folder = folders[y];
        try{
            fs.readdirSync(`${path}/${folder.name}`);
        }catch(err){
            try{
                fs.mkdirSync(`${path}/${folder.name}`);
            } catch(err){
                logger.debug(err);
            }
        }
        await copyFolder(`${path}/${folder.name}`, `${destPath}/${folder.name}`);
    }

    logger.debug("Copied " + path + " to " + destPath);
    return true;
}

module.exports = {
    unzip,
    checkForFile,
    getFiles,
    copyFolder,
    moveFolder,
    removeFolder
}