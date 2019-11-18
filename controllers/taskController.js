const helper = require('../utility/helper')();
const Task = require('../models/Task');
const taskService = require('../services/taskService');
const Voter = require('../models/Voter');
const SentryLogger = require('../utility/SentryLogger');
const loggerService = require('../services/loggerService');

exports.Task = async (req, res) => {
    const task_id = req.body.taskId;
    const voter_id = req.body.voterId;
    const userId = req.body.userId;
    const rule_Id = req.body.ruleId;
    const status = req.body.status;
    const points = req.body.points;
    const taskName = req.body.taskName;
    const taskSpread = req.body.taskSpread;
    const taskDescription = req.body.taskDescription;
    const parentTaskId = req.body.parentTaskId;
    const comments = req.body.comments;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    const count = await Task.countDocuments({ taskId: task_id });
    if (count > 0) {
        return helper.response(400, 'A task with that taskId already exists!', res);
    }
    else {
        try {
            let task = await Task.create({
                taskId: task_id,
                voterId: voter_id,
                userId: userId,
                ruleId: rule_Id,
                status: status,
                points: points,
                taskName: taskName,
                taskSpread: taskSpread,
                taskDescription: taskDescription,
                parentTaskId: parentTaskId,
                comments: comments,
                startDate: startDate,
                endDate: endDate,
            });

            await task.save();
            if (parentTaskId) { // Update subtasks in parent grouped tasks.
                var tid = task._id.toString();
                let parentTask = await Task.findOne({ taskId: parentTaskId });
                parentTask.subTasks.push(tid);
                var query = { taskId: parentTaskId };
                await Task.update(query, { $set: parentTask, "updatedAt": new Date() });
            }
            res.status(200);
            res.json({
                status: 200,
                message: "task created successfully",
                task: {
                    _id: task._id.toString(),
                    taskId: task.taskId,
                    userId: task.userId,
                    voterId: task.voterId,
                    ruleId: task.ruleId,
                    status: task.status,
                    points: task.points,
                    taskName: task.taskName,
                    taskSpread: task.taskSpread,
                    taskDescription: task.taskDescription,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                    parentTaskId: task.parentTaskId,
                    comments: task.comments,
                    startDate: task.startDate,
                    endDate: task.endDate,
                }
            });

        } catch (error) {
            SentryLogger.log(error);
            return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
        }
    }
};

exports.getTask = async (req, res) => {
    const task_id = req.params.taskId;
    const task = await Task.findOne({ taskId: task_id });
    if (task === null) {
        return helper.response(200, 'Task with the requested id was not found!', res);
    }
    res.status(200);
    res.json({
        status: 200,
        message: "Task found",
        task: {
            _id: task._id.toString(),
            taskId: task.taskId,
            userId: task.userId,
            voterId: task.voterId,
            ruleId: task.ruleId,
            status: task.status,
            points: task.points,
            taskName: task.taskName,
            taskSpread: task.taskSpread,
            taskDescription: task.taskDescription,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
        }
    });
};

exports.getTaskLists = async (req, res) => {
    const user_id = req.params.userId;
    let tasks = [];
    try {
        tasks = await Task.find({ userId: `${user_id}` });
    } catch (ex) {
        console.log(ex);
    }
    if (tasks.length === 0) {
        return helper.response(200, 'No tasks present for this user', res);
    }
    let cleanedTasks = [];
    await Promise.all(tasks.map(async (task) => { //Removing unnecessary properties
        task["createdAt"] = undefined;
        task["updatedAt"] = undefined;
        task["__v"] = undefined;
        var subTasks = await Task.find({ userId: `${user_id}`, parentTaskId: task._id }); // Getting all subtasks
        task["parentTaskId"] = undefined;
        await Promise.all(subTasks.map(async (st) => {
            st["subTasks"] = undefined;
            st["createdAt"] = undefined;
            st["updatedAt"] = undefined;
        }));
        task.subTasks = subTasks;
        cleanedTasks.push(task);
    }));
    res.status(200);
    res.json(cleanedTasks);
};

exports.getAllTasksByVoterId = async (req, res) => {
    const voter_id = req.params.voterId;
    let tasks = [];
    try {
        tasks = await Task.find({ voterId: voter_id });
    } catch (ex) {
        console.log(ex);
    }
    if (tasks.length === 0) {
        return helper.response(200, 'No tasks present for the requested voterid', res);
    }
    let cleanedTasks = [];
    await Promise.all(tasks.map(async (task) => { //Removing unnecessary properties
        task["createdAt"] = undefined;
        task["updatedAt"] = undefined;
        task["__v"] = undefined;
        var subTasks = await Task.find({ userId: `${task.userId}`, parentTaskId: task._id }); // Getting all subtasks
        task["parentTaskId"] = undefined;
        await Promise.all(subTasks.map(async (st) => {
            st["subTasks"] = undefined;
            st["createdAt"] = undefined;
            st["updatedAt"] = undefined;
        }));
        task.subTasks = subTasks;
        cleanedTasks.push(task);
    }));
    res.status(200);
    res.json(cleanedTasks);
};

exports.removeTask = async (req, res) => {
    const task_id = req.params.taskId;
    let task = await Task.findOne({ taskId: task_id });
    if (task === null) {
        return helper.response(200, 'Task with that id was not found!', res);
    }
    try {
        await task.delete();
        return helper.response(200, 'Task removed successfully', res);
    } catch (error) {
        SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
    }
};

exports.updateTask = async (req, res) => {
    const task_id = req.params.taskId;
    let task = await Task.findOne({ taskId: task_id });
    if (task === null) {
        loggerService.log(req.useragent,'User updates a task ','Failure','Something went wrong, please try again later');
        return helper.response(200, 'Task with that id was not found!', res);
    }
    try {
        var query = { taskId: task_id };
        await Task.update(query, { $set: req.body, "updatedAt": new Date() });
        loggerService.log(req.useragent,'User updates a task ','Success','Task updated successfully');
        return helper.response(200, 'Task updated successfully', res);
    } catch (error) {
        SentryLogger.log(error);
        loggerService.log(req.useragent,'User updates a task ','Failure',error.message);
        return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
    }
};

exports.processTasksForVoterUpdates = async (req, res) => {
    loggerService.log(req.useragent,'User updates a task ','Failure','Something went wrong, please try again later');
    await taskService.createTasksForVoter();
    res.status(200);
    res.json({
        status: 200,
        message: "Task processing started for new voter updates!"
    });
};

exports.generateTasks = async (req, res) => {
    const user_id = req.params.userId;
    const voters = await Voter.find({ userId: `${user_id}` });
    if (voters.length === 0) {
        return helper.response(200, 'No voters found for this user', res);
    }
    try {
        taskService.checkRulesForVoter(voters);
        res.status(200);
        res.json({
            status: 200,
            message: "Tasks processing started for voters!"
        });
    }
    catch (error) {
        SentryLogger.log(error);
    }
};
