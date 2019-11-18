
const merge = require('lodash/merge');

const taskGroups = require('./taskGroup');
const literatureType = require('./literatureType');

var constants = {};

merge(constants, taskGroups);
merge(constants, literatureType);

module.exports = constants;