const Log = require('../models/Log');

const log = (source, name, type, details) => {
    Log.create({
        transactionSource: source,
        transactionName: name,
        transactionType: type,
        transactionDetails: details
    });
};

module.exports = { log };
