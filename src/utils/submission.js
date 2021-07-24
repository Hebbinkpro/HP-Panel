const projectController = require("../project/controller");
const fileUtils = require("./file");

async function checkUnzipOutput(submissionId){
    var projectExists = await projectController.exists(submissionId);
    if(!projectExists) return null;

    var submission = await projectController.getById(submissionId);
    var startFile = submission.startFile;

    var submissionFolder = `${process.cwd()}/data/submissions/${submissionId}/output`;
    
    return await fileUtils.checkForFile(submissionFolder, startFile);
}

async function reject(submissionId){
    var projectExists = await projectController.exists(submissionId);
    if(!projectExists) return false;
    
    var submissionFolder = `${process.cwd()}/data/submissions/${submissionId}`;
    var rejectionFolder = `${process.cwd()}/data/rejections/${submissionId}`;
    
    fileUtils.moveFolder(submissionFolder,rejectionFolder);
}

async function approve(submissionId){
    var projectExists = await projectController.exists(submissionId);
    if(!projectExists) return false;
    
    var submissionFolder = `${process.cwd()}/data/submissions/${submissionId}`;
    var projectFolder = `${process.cwd()}/projects/${submissionId}`;
    var backupFolder = `${process.cwd()}/data/projects/${submissionId}`;
    
    var copy = await fileUtils.copyFolder(submissionFolder+"/output", projectFolder);
    fileUtils.moveFolder(submissionFolder,backupFolder);

    return copy;
}

module.exports = {
    checkUnzipOutput,
    approve,
    reject
}