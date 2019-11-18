const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const leaderBoardSchema = new mongoose.Schema({
  period: String,
  leaders: [{
    firstname: String,
    lastname: String,
    avatar: String,
    tasksDone: Number,
    pointsEarned: Number,
    allScore: Number
  }],
  updateAt: { type: Date, default: Date.now }
});

leaderBoardSchema.query.byPeriod = period => {
  return this.where({ period });
};

const LeaderBoard = db.model('LeaderBoard', leaderBoardSchema);

module.exports = LeaderBoard;
