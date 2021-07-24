const supportedPlatforms = [
    "win32",
    "linux"
];

function valid(){
    if(supportedPlatforms.includes(process.platform)) return true;
    return false;
}

function removeLines(string){
    if(process.platform === "win32"){
        while(string.indexOf("\r\n") > -1){
            string = string.replace("\r\n", "");
        }
        return string;
    }
    if(process.platform === "linux"){
        while(string.indexOf("\n") > -1){
            string = string.replace("\n", "");
        }
        return string;
    }

    return string;
}

function newLine(){
    if(process.platform === "win32"){
        return "\r\n";
    }
    if(process.platform === "linux"){
        return "\n";
    }

    return null;
}

module.exports = {
    supported: supportedPlatforms,
    valid,
    removeLines,
    newLine: newLine()
}