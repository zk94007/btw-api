/**
 *  Created by KennethObikwelu on 9/12/19.
 */

const ElectionProfile = require('../models/ElectionProfile');
const helper = require('../utility/helper')();
const SentryLogger = require('../utility/SentryLogger');
const loggerService = require('../services/loggerService');


exports.getElectionProfiles = async (req, res) => {
	try {
		const electionProfiles = await ElectionProfile.find({});
		const electionProfileMap = {};
		electionProfiles.forEach((electionProfile) => {
			electionProfileMap[electionProfile._id] = electionProfile;
		});
		res.json({
			status: 200,
			count : electionProfiles.length,
			electionProfileMap
		});
	} catch (error) {
		console.log(error);
		SentryLogger.log(error);
	}
}

exports.addElectionProfile = async (req, res) => {
	try {
		const state = req.body.state;
		const governorship = req.body.governorship;
		const federalStateWideRaces = req.body.federalStateWideRaces;
		const stateWideRaces = req.body.stateWideRaces;
		const municipalities = req.body.municipalities;


		let electionProfile = await ElectionProfile.create({
			state,
			governorship,
			federalStateWideRaces,
			stateWideRaces,
			municipalities
		});
		electionProfile.save();
		return helper.response(200, 'Record added successfully', res);

	} catch (error) {
		console.log(error);
		SentryLogger.log(error);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
}

