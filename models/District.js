const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const districtSchema = new mongoose.Schema({
    ocdId: String,
    name: String,
    country: String,
    state: String,
    cd: String,
});

const District = db.model('District', districtSchema);

module.exports = District;
