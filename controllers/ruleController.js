const bcrypt = require('bcrypt');
const helper = require('../utility/helper')();
const auth0 = require('../services/auth0api').get();
const Rule = require('../models/Rule');
const SentryLogger = require('../utility/SentryLogger');


exports.Rule = async (req, res) => {
    const rule_id = req.body.ruleId;
    const ruleDescription = req.body.ruleDescription;
    const points = req.body.points;
    const ruleSpread = req.body.ruleSpread;
    const ruleName = req.body.ruleName;
    const conditions = req.body.conditions;
    const ruleType = req.body.ruleType;
    const timeFrame = req.body.timeFrame;
    const isActive = req.body.isActive;

    const count = await Rule.countDocuments({ ruleId: rule_id });
    if (count > 0) {
        return helper.response(400, 'A rule with that ruleId already exists!', res);
    }
    else {
        try {
            let rule = await Rule.create({
                ruleId: rule_id,
                ruleDescription: ruleDescription,
                ruleSpread: ruleSpread,
                ruleName: ruleName,
                points: points,
                conditions: conditions,
                ruleType: ruleType,
                timeFrame: timeFrame,
                isActive: isActive
            });

            await rule.save();
            res.status(200);
            res.json({
                status: 200,
                message: "rule created successfully",
                rule: {
                    _id: rule._id.toString(),
                    ruleId: rule.ruleId,
                    ruleDescription: rule.ruleDescription,
                    ruleSpread: rule.ruleSpread,
                    ruleName: rule.ruleName,
                    points: rule.points,
                    conditions: rule.conditions,
                    ruleType: rule.ruleType,
                    timeFrame: rule.timeFrame,
                    isActive: rule.isActive,
                    createdAt: rule.createdAt,
                    updatedAt: rule.updatedAt
                }
            });
        } catch (error) {
            SentryLogger.log(error);
            return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105' ,res);
        }
    }
};

exports.getRule = async (req, res) => {
    const rule_id = req.params.ruleId;
    let rule = null;
    rule = await Rule.findOne({ ruleId: rule_id });
    if (rule === null) {
        return helper.response(404, 'rule with the requested id was not found!', res);
    }
    res.status(200);
    res.json({
        status: 200,
        message: "rule found",
        rule: {
            _id: rule._id.toString(),
            ruleId: rule.ruleId,
            ruleDescription: rule.ruleDescription,
            ruleSpread: rule.ruleSpread,
            ruleName: rule.ruleName,
            points: rule.points,
            conditions: rule.conditions,
            ruleType: rule.ruleType,
            timeFrame: rule.timeFrame,
            isActive: rule.isActive,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt
        }
    });
};
exports.getAllRule = async (req, res) => {
    let rules = [];
    rules = await Rule.find({});
    res.status(200);
    res.json({
        status: 200,
        message: "All rules",
        rules
    });
};

exports.removeRule = async (req, res) => {
    const rule_id = req.params.ruleId;
    let rule = await Rule.findOne({ ruleId: rule_id });
    if (rule === null) {
        return helper.response(404, 'Rule with that id was not found!', res);
    }
    try {
        await rule.delete();
        return helper.response(200, 'Rule removed successfully', res);
    } catch (error) {
        SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105' ,res);
    }
};
exports.updateRule = async (req, res) => {
    const rule_id = req.params.ruleId;
    const ruleDescription = req.body.ruleDescription;
    let rule = await Rule.findOne({ ruleId: rule_id });

    if (rule === null) {
        return helper.response(404, 'Rule with that id was not found!', res);
    }
    try {
        var query = { ruleId: rule_id };
        await Rule.update(query, { $set: req.body, "updatedAt": new Date() });
        rule.ruleDescription = ruleDescription;
        return helper.response(200, 'Rule updated successfully', res);
    } catch (error) {
        SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105' ,res);
    }
};
