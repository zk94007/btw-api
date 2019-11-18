const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const logSchema = new mongoose.Schema({
        transactionTimeStamp:  { type: Date, default: Date.now },
        transactionSource: Object,
        transactionName: String,
        transactionType: String,
        transactionDetails: String
});

const Log = db.model('Log', logSchema);

module.exports = Log;
