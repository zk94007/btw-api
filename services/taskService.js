const config = require('../config');
var ObjectId = (require('mongoose').Types.ObjectId)
const Voter = require('../models/Voter');
const Rule = require('../models/Rule');
const Task = require('../models/Task');
var Request = require('request-promise');
const uuidv4 = require('uuid/v4');
var AWS = require('aws-sdk');
const moment = require('moment');
const User = require('../models/User');
const SentryLogger = require('../utility/SentryLogger');
AWS.config.update({
    region: `${config.region}`,
    accessKeyId: `${config.aws_s3_access_key}`,
    secretAccessKey: `${config.aws_s3_secret_key}`
});
var sqs = new AWS.SQS();
const mg = require('mailgun-js');
const { api_key: apiKey, domain } = config.mailgun;
const mailgun = mg({ apiKey, domain });


//Create tasks for all the voters who are updated.
const createTasksForVoter = () => {
    getMessagesFromQueue();
};


//Get all the messsages from queue
const getMessagesFromQueue = async () => {
    //To check Maximum Available Messages
    var params = {
        'QueueUrl': `${config.queue_url}`,
        'AttributeNames': ['All']
    }
    const queueAttributes = await sqs.getQueueAttributes(params).promise();
    const maximumAvailableMessages = queueAttributes.Attributes.ApproximateNumberOfMessages;
    const messageBatch = (maximumAvailableMessages / 10) + 1;
    const mesagesLength = Math.ceil(messageBatch);
    let voterIds = []
    let voterIdsDeleted = [];
    for (var queueMessage = 0; queueMessage < mesagesLength; queueMessage++) {
        const receiveMessage = await sqs.receiveMessage({ 'AttributeNames': ['SentTimestamp'], 'MaxNumberOfMessages': 10, 'MessageAttributeNames': ['All'], 'WaitTimeSeconds': '20', 'VisibilityTimeout': '0', 'QueueUrl': `${config.queue_url}` }).promise();
        if (receiveMessage && receiveMessage.Messages && receiveMessage.Messages.length > 0) { //Check if there are messages in the queue
            await Promise.all(receiveMessage.Messages.map(async message => {
                var msgBody = message.Body;
                var myMsg = JSON.parse(msgBody);
                var msg_id = myMsg._id.$oid;
                if (myMsg.operationType == 'insert' | 'replace' | 'update') {
                    voterIds.push(ObjectId(msg_id));
                }
                else if (myMsg.operationType == 'delete') {
                    voterIdsDeleted.push(ObjectId(msg_id));
                }
                sqs.deleteMessage({
                    'QueueUrl': `${config.queue_url}`,
                    'ReceiptHandle': message.ReceiptHandle
                }, (err, resp) => {
                    if (err) throw err
                })
            }));
        }
    }
    if (voterIds.length > 0) { // process voter updates
        var voters = await Voter.find({ _id: { $in: voterIds } });
        if (voters.length > 0) {
            checkRulesForVoter(voters);
        }
    }
    if (voterIdsDeleted.length > 0) { //delete tasks
        await Task.deleteMany({ voterId: { $in: voterIdsDeleted } });
    }
};

//Check rules for the specific voter.
const checkRulesForVoter = async (voters) => {
    let rules = [];taskCount = 0;
    try {
        rules = await Rule.find({ isActive: true, ruleType: "IN" });
        if (rules.length > 0 && voters.length > 0) {
            for (var rule of rules) {
                for (var voter of voters) {
                    if (voter.userId) {
                        var existingTasks = await Task.find({ userId: voter.userId, voterId: voter._id, ruleId: rule.ruleId });
                        if (existingTasks.length < 1) { //Check for duplicates
                            var currentTasks = await checkCurrentTasks(voter.userId);
                            if (currentTasks.length <= config.allowed_tasks_count && taskCount <= config.allowed_tasks_count) {  // if user have less than 20 tasks, then only create new tasks.
                                if (rule && rule.conditions && rule.conditions.length > 0) {
                                    let condition_expression = '';
                                    for (var condition of rule.conditions) {
                                        if (condition.concatOperator === "" || condition.concatOperator === null) {
                                            condition_expression = condition_expression + "voter." + condition.property + " " + condition.operator + " " + `"${condition.value}"` + " ";
                                            //evaluating condition after checking for concat operators
                                            if (condition_expression) {
                                                if (eval(condition_expression)) {
                                                    //task creation after successful evaluation
                                                    let task = await Task.create(createTaskDocument(rule, voter));
                                                    await task.save();
                                                    taskCount++;
                                                }
                                            }
                                        }
                                        //taking all values from condition doc into array for && and or operators
                                        else if (condition.concatOperator === "&&" || condition.concatOperator === "||") {
                                            condition_expression = condition_expression + "voter." + condition.property + " " + condition.operator + " " + `"${condition.value}"` + " " + condition.concatOperator + " ";
                                        }
                                    };
                                } else if (rule && rule.conditions && rule.conditions.length == 0) { // for rules (like DMGR_NAT_001) which have no conditions and applicable to all.
                                     let task = await Task.create(createTaskDocument(rule, voter));
                                     await task.save();
                                }
                                createBOTasks(voter.userId);
                                dissolveBOTasks(voter.userId);
                            } else if (currentTasks.length >= config.allowed_tasks_count) { //Update newTasksWaiting property to true
                                var user = await User.findOne({ _id: voter.userId });
                                if (user) {
                                    await User.updateOne({ "_id": voter.userId }, { "$set": { "newTasksWaiting": true } });
                                }
                            }
                        }
                    }
                };
            };
        }
    } catch (error) {
        console.log(error);
        SentryLogger.log(error);
    }
};

const createBOTasks = async (userId) => {
    let rules = [];
    try {
        rules = await Rule.find({ isActive: true, ruleType: "BO" }); //Get all BO rules
        var tasks = await Task.find({ userId: userId, parentTaskId: "", ruleId: { $nin: ["BO1", "BO2", "BO3", "BO4", "BO5"] } }); //get independent tasks for user $nin denotes NOT IN
        for (var rule of rules) {
            //Lets build conditions first.
            let condition_expression = '';
            let boAggregator = '';
            if (rule && rule.conditions && rule.conditions.length > 0) {
                for (var condition of rule.conditions) {
                    if (condition.property === "count") { //If concatOperator is empty that means its a aggregator condition. 
                        boAggregator = condition.property + " " + condition.operator + " " + condition.value + " ";
                    } else {
                        condition_expression = condition_expression + "task." + condition.property + " " + condition.operator + " " + `"${condition.value}"` + " " + condition.concatOperator + " ";
                    }
                };
            }
            //cleanup
            var last2 = condition_expression.slice(-2);
            if (last2 === "&&" || last2 === "||") {
                condition_expression = last2;
            }
            //Now check all the conditions and create BO.
            let subTaskIds = [];
            let count = 0;
            for (var task of tasks) {
                if (condition_expression && eval(condition_expression)) {
                    subTaskIds.push(task._id);
                    count++;
                }
                if (boAggregator && eval(boAggregator)) { //aggregator condition should always look like this : count == value
                    let boTask = await Task.create(createBOTaskDocument(userId, rule));
                    await boTask.save();
                    await Task.updateMany({ "_id": { $in: subTaskIds } }, { "$set": { "parentTaskId": boTask._id } });
                    return;
                }
            };
        };
    } catch (error) {
        console.log(error);
        SentryLogger.log(error);
    }
};

const dissolveBOTasks = async (userId) => {
    try {
        //Get BO task using userId & ruleId
        var boTasks = await Task.find({ userId: userId, ruleId: { $in: ["BO1", "BO2", "BO3", "BO4", "BO5"] } });
        if (boTasks.length > 0) {
            for (var boTask of boTasks) {
                if (boTask.endDate) {
                    var isExpired = moment(new Date().toISOString()).isAfter(moment(new Date(boTask.endDate).toISOString()));
                    if (isExpired == true) {
                        //get subTask id's array by checking parentTaskId's & subtask status not completed & sort according to points
                        let subTasks = await Task.find({ userId: userId, parentTaskId: boTask._id, status: { $ne: 'completed' } }).sort({ points: -1 }).project({ _id: 1 }).toArray();
                        var currentTasks = await checkCurrentTasks(userId);
                        if (subTasks.length > 0) {
                            var allowedTasksCount = config.allowed_tasks_count - currentTasks.length;
                            if (subTasks.length > allowedTasksCount) {
                                subTasks = subTasks.slice(0, allowedTasksCount);
                                // and set newTasksWaiting to true for the remaining tasks out of allowedTasksCountLimit
                                var user = await User.findOne({ _id: userId });
                                if (user) {
                                    await User.updateOne({ "_id": userId }, { "$set": { "newTasksWaiting": true } });
                                }
                            }
                            //remove parentTaskId to make it as individual tasks.
                            await Task.updateMany({ "_id": { $in: subTasks } }, { "$set": { "parentTaskId": "" } });
                        }
                    }
                }
            };
        }
    } catch (error) {
        console.log(error);
        SentryLogger.log(error);
    }
};

const checkCurrentTasks = async (userId) => {
    //This will bring all the independent tasks and BO tasks as both will not have parentTaskId
    var tasks = await Task.find({ userId: userId, parentTaskId: "", status: { $ne: 'completed' } });
    return tasks;
}

const createTaskDocument = (rule, voter) => {
    return {
        taskId: uuidv4(),
        voterId: voter._id,
        userId: voter.userId,
        ruleId: rule.ruleId,
        status: "notstarted",
        parentTaskId: "",
        points: `${rule.points}`,
        taskName: rule.ruleName,
        taskSpread: rule.ruleSpread,
        taskDescription: rule.ruleDescription
    };

};

const createBOTaskDocument = (userId, rule) => {
    let startDate = new Date();
    return {
        taskId: uuidv4(),
        userId: userId,
        ruleId: rule.ruleId,
        status: "notstarted",
        points: rule.points,
        parentTaskId: "",
        taskName: rule.ruleName,
        taskDescription: rule.ruleName,
        startDate: startDate,
        endDate: moment(startDate, "DD-MM-YYYY").add(rule.timeFrame, 'days')
    };

};

const sendMailToUser = async () => {
    let taskDescription = [];
    try {
        //get distinct userId
        var userIds = await Task.find({}).distinct('userId');
        // loop these userIds and getting all tasks for these userids
        await Promise.all(userIds.map(async userId => {
            // Get all distinct userids from Tasks table
            var tasks = await Task.find({ userId: userId });
            await Promise.all(tasks.map(async task => {
                //Put all these tasks in one email for a user
                taskDescription.push(task.taskDescription);

            }));
            // Getting user email using userId
            var user = await User.findOne({ _id: userId });
            var data = {
                from: `${config.mailgun.from_whom}`,
                to: `${user.email}`,
                subject: 'Other active tasks',
                text: `${taskDescription}`
            };
            const mail = await mailgun.messages().send(data);
        }));
    } catch (error) {
        console.log(error);
        SentryLogger.log(error);
    }
};

module.exports = { createTasksForVoter, checkRulesForVoter, sendMailToUser };
