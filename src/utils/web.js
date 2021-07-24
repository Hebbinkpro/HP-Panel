function getUrlMsg(req, destUrl=null){
    var url = destUrl;
    if(url === null) url = req.url;

    if(!req.session.msg[url]){
        return {
            content: "",
            color: "transparent",
            maxUses: 0,
            used: 0
        };
    }

    return req.session.msg[url];
}

function setUrlMsg(req, destUrl, msg, color="white", maxUses=1){
    req.session.msg[destUrl] = {
        content: msg,
        color: color,
        maxUses: maxUses,
        used: 0
    };
}

module.exports = {
    getUrlMsg,
    setUrlMsg
}