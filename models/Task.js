const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const taskSchema = new mongoose.Schema({
    taskId: String,
    voterId: String,
    userId: String,
    status: String,
    ruleId: String,
    points: {
        type: Number,
        required: true,
    },
    taskDescription: String,
    taskName: String,
    taskSpread: String,
    parentTaskId: String,
    subTasks: [""],
    startDate: String,
    endDate: String,
    comments: [{
        text: String,
        images: [""],
        createdAt: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createdAt = new Date();
        this.markModified('createdAt');
    }
    next();
});


const Task = db.model('Task', taskSchema);

module.exports = Task;
