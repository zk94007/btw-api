const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const voterSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    electionProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserElectionProfile',
      required: true
    },
    elasticId: String,
    firstname: String,
    lastname: String,
    address: {
      type: Object,
      default: null
    },
    birthday: String,
    phone: String,
    avatar: String,
    gender: String,
    socialId: String,
    details: Object,
    voterDesc: String,
    voterStatusDesc: String,
    voterStatusReasonDesc: String,
    source:[{
      type:{
        type: String
      },
      name: String
    }],
    comments: [{
      text: String,
      images: [""],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
});

const Voter = db.model('Voter', voterSchema);

module.exports = Voter;
