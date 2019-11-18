const helper = require('../utility/helper')();
const Voter = require('../models/Voter');
const Task = require('../models/Task');
const SentryLogger = require('../utility/SentryLogger');
const loggerService = require('../services/loggerService');
const {getVoterHistory} = require('./elasticController');
const errorHandler = require('../errorHandler');

exports.getVoterLists = async (req, res) => {
	const user_id = req.params.userId;
	const votersList = await Voter.find({ userId: `${user_id}` });
	if (votersList === null || votersList.length === 0) {
		return helper.response(200, 'No voters found for the requested userid', res);
	}
	const count = votersList.length;
	res.status(200);
	res.json({
		status: 200,
		count: count,
		votersList
	});
};
exports.updateVoter = async (req, res) => {
	const voter_id = req.params.Id;
	try {
		let voter = await Voter.findById(voter_id);
		if (voter === null) {
			loggerService.log(req.useragent, 'User edits voters', 'Failure', 'Voter with that id was not found!');
			return helper.response(200, 'Voter with that id was not found!', res);
		}
		var query = { _id: voter_id };
		await Voter.update(query, { $set: req.body });
		loggerService.log(req.useragent, 'User edits voters', 'Success', 'Voter updated successfully');
		return helper.response(200, 'Voter updated successfully', res);
	} catch (error) {
		loggerService.log(req.useragent, 'User edits voters', 'Failure', error.message);
		SentryLogger.log(error);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.removeVoter = async (req, res) => {
	const voter_id = req.params.Id;
	try {
		const voter = await Voter.findByIdAndDelete(voter_id);
		if (voter === null) {
			loggerService.log(req.useragent, 'User deletes voters', 'Failure', 'Voter with that id was not found!');
			return helper.response(200, 'Voter with that id was not found!', res);
		}
		var tasks = await Task.find({ voterId: voter_id });
		if (tasks.length > 0) {
			await Task.deleteMany({ voterId: voter_id });
		}
		loggerService.log(req.useragent, 'User deletes voters', 'Success', 'Voter and related tasks removed successfully');
		return helper.response(200, 'Voter and related tasks removed successfully', res);
	} catch (error) {
		loggerService.log(req.useragent, 'User deletes voters', 'Failure', error.message);
		SentryLogger.log(error);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.updateVoterComment = async (req, res) => {
	try {
		const { voterId, commentId } = req.params;
		const { modifiedText } = req.body;
		const voter = await Voter.updateOne({
			_id: voterId,
			"comments._id": commentId
		}, { $set: { "comments.$.text": modifiedText } });
		return helper.response(200, 'Comment was edited!', res);
	} catch (e) {
		console.log(e);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.deleteVoterComment = async (req, res) => {
	try {
		const { voterId, commentId } = req.params;
		await Voter.updateOne({ _id: voterId }, { $pull: { comments: { _id: commentId } } });
		return helper.response(200, 'Comment was deleted!', res);
	} catch (e) {
		console.log(e);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.addVoterComment = async (req, res) => {
	try {
		const { voterId } = req.params;
		const { comment } = req.body;
		await Voter.updateOne({ _id: voterId }, { $push: { comments: comment } });
		return helper.response(200, 'Comment was added!', res);
	} catch (e) {
		console.log(e);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.getVoterHistory = async (req, res) => {
	try {
		const { voterRegNum } = req.params;
		const { state } = req.query;
		const { voterHistory } = await getVoterHistory(voterRegNum, state);
		res
			.status(200)
			.json({
				status: 200,
				message: 'Voter history returned successfully',
				voterHistory,
			});
	} catch (error) {
		SentryLogger.log(error);
		error = error.message || error;
		return errorHandler(error, res, req, next);
	}
};
