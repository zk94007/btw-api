const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const potentialVoterSchema = new mongoose.Schema({
  id: String,
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  _index: String,
  _score: Number,
  firstname: String,
  lastname: String,
  address: String,
  phone: String,
  birthday: String,
  gender: String,
  voterStatusDesc: String,
  voterStatusReasonDecs: String,
  probability: Number
});

const PotentialVoter = db.model('PotentialVoter', potentialVoterSchema);

module.exports = PotentialVoter;
