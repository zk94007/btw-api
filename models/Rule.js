const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const ruleSchema = new mongoose.Schema({
    ruleId: String,
    ruleDescription: String,
    ruleSpread: String,
    ruleName: String,
    points: {
        type: Number,
        required: true,
    },
    conditions: [
        {
            property: String,
            operator: String,
            value: String,
            concatOperator: String

        }
    ],
    ruleType: {
        type: String,
        required: true
    },
    timeFrame: {
        type: Number
    },
    isActive: Boolean,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

ruleSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createdAt = new Date();
        this.markModified('createdAt');
    }
    next();
});


const Rule = db.model('Rule', ruleSchema);

module.exports = Rule;
