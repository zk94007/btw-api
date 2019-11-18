const moment = require('moment');

const User = require('../models/User');
const Voter = require('../models/Voter');
const PotentialVoter = require('../models/PotentialVoter');
const Contact = require('../models/Contact');
const LeaderBoard = require('../models/LeaderBoard');
const { getVoterFromElastic } = require('../controllers/elasticController');
const { getDistrictsByAddress } = require('../services/civicApi');
const csv = require('fast-csv');
const xlsx = require('node-xlsx');
const errorHandler = require('../errorHandler');
const { searchByQuery } = require('./elasticController');
const { getPotentialVoters } = require('../services/twitter');
const loggerService = require('../services/loggerService');
const SentryLogger = require('../utility/SentryLogger');
const {
	mapDashboardLeaderboard,
	getLeaderBoard,
	getDay
} = require('../helpers/task');


exports.leaderBoard = async (req, res, next) => {
	const { period } = req.query;
	let dateFrom = null,
		dateTo = null;

	switch (period) {
		case 'today':
			dateFrom = getDay('day', true);
			dateTo = getDay('day', false);
			break;
		case 'allTime':
			dateFrom = new Date(0);
			dateTo = new Date();
			break;
		case 'month':
			dateFrom = getDay(period, true);
			dateTo = getDay(period, false);
			break;
		case 'week':
			dateFrom = getDay(period, true);
			dateTo = getDay(period, false);
			break;
	}

	if (dateFrom === null) {

		res
			.status(400)
			.json({
				status: 400,
				message: "Incorrect data in period"
			});
	} else {
		const leaderBoard = await getLeaderBoard(dateFrom, dateTo);

		res
			.status(200)
			.json({
				status: 200,
				message: 'LeaderBoard was returned successfully',
				data: leaderBoard
			})
	}
};

exports.dashboardLeaderBoard = async (req, res, next) => {
	try {
		const period = 'week';
		let dateFrom = getDay(period, true),
			dateTo = getDay(period, false);

		const substractWeek = date => {
			return moment(date).subtract(7, 'd').toDate();
		};

		const leaderBoard = await getLeaderBoard(dateFrom, dateTo);
		const previousLeaderBoard = await getLeaderBoard(substractWeek(dateFrom), substractWeek(dateTo))

		await LeaderBoard.updateOne({ period }, { leaders: leaderBoard });

		const dates = {
			current: { dateFrom, dateTo },
			previous: { dateFrom: substractWeek(dateFrom), dateTo: substractWeek(dateTo) }
		};

		res
			.status(200)
			.json({
				status: 200,
				message: 'LeaderBoard was returned successfully',
				data: mapDashboardLeaderboard(dates, leaderBoard, previousLeaderBoard)
			})

	} catch (error) {
		SentryLogger.log(error);
		error = error.message || error;
		return errorHandler(error, res, req, next);
	}
};

/**
 * This method shows results on the add_voters/select_voters page.
 * It also specifies how many results can be returned to the frontend
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
exports.showResult = async (req, res, next) => {
	try {
		const { email } = req.user["https://bethewave.vote"];
		const user = await User.findOne({ email });
		const contacts = await Contact.find({ userId: user._id }).limit(500).sort('-maxScore').lean();
		if (contacts === null) {
			res
				.status(200)
				.json({
					status: 200,
					message: "Contacts were not found",
					contacts: []
				})
		}
		const contactsArray = await Promise.all(
			contacts.map(contact => findContactWithVoterOrPotentialVoters(contact))
		);
		res
			.status(200)
			.json({
				status: 200,
				message: 'Contacts returned successfully',
				contacts: contactsArray
			});
	} catch (error) {
		console.log(error);
		return errorHandler(error, res, req, next);
	}
};

async function findContactWithVoterOrPotentialVoters(contact) {
	const voter = await Voter.findOne({ socialId: contact.socialId }).lean();
	if (voter && contact.socialId) {
		contact.hasVoter = true;
		contact.voter = voter;
		return contact
	} else {
		contact.potentialVoters = await PotentialVoter.find({ contactId: contact._id }).lean();
		contact.hasVoter = false;
		return contact;
	}
}

exports.parseFile = async (req, res, next) => {
	try {
		const { email } = req.user["https://bethewave.vote"];
		const user = await User.findOne({ email }).lean();
		const { _id } = user;
		const {
			file,
			file: { name },
		} = req.files;
		const nameArray = name && name.split('.');
		const extension = nameArray.length > 1 ? nameArray[nameArray.length - 1] : null;

		const contacts = [];
		if (!file) {
			throw new Error("File is empty");
		}
		const allowedExelExtentions = ['xlsx', 'xls'];
		if (extension === 'csv') {
			csv
				.parseString(file.data.toString(), {
					headers: true,
					ignoreEmpty: true
				})
				.on('data', data => {
					//get congressional district
					const newContact = {
						userId: _id,
						firstname: data.firstname,
						lastname: data.lastname,
						phone: data.phone,
						gender: data.gender,
						avatar: data.avatar,
						birthday: data.birthday,
						address: data.address,
						congressionalDistrict: getDistrictsByAddress(data.address),
						source: [{
							type: 'file',
							name
						}]
					};
					contacts.push(newContact);
				})
				.on('end', async () => {
					const result = contacts.map(contact => getPotentialVoters(contact));
					await Promise.all(result);
					res.status = 200;
					res.json({
						status: 200,
						message: 'New contacts were added',
						fileName: name
					});
				});
		} else if (allowedExelExtentions.includes(extension)) {
			const parseFile = xlsx.parse(req.files.file.data);
			const convert = await convertToJSON(parseFile[0].data);
			const result = convert.map(contact => getPotentialVoters(contact, _id));
			await Promise.all(result);
			res.status = 200;
			res.json({
				status: 200,
				message: 'New contacts were added',
				fileName: name
			});
		} else {
			throw new Error("Bad file");
		}
	} catch (e) {
		console.log(e);
		e = e.message || e;
		return errorHandler(e, res, req, next);
	}
};

exports.searchPotentialVotersByQuery = async (req, res, next) => {
	try {
		const { query, state } = req.query;
		const { potentialVoters } = await searchByQuery(query, state);
		res
			.status(200)
			.json({
				status: 200,
				message: 'Potential voters returned successfully',
				potentialVoters,
			});
	} catch (e) {
		e = e.message || e;
		return errorHandler(e, res, req, next);
	}
};

exports.addVoters = async (req, res, next) => {
	try {
		const { email } = req.user["https://bethewave.vote"];
		const user = await User.findOne({ email });
		const _id = user._id;
		const voters = req.body.voters;
		const maxSize = 10;
		if (voters.length > maxSize) {
			loggerService.log(req.useragent, 'User Adds voters', 'Failure', 'Incorrect date in voters');
			throw new Error('Incorrect date in voters');
		}

		//get active electionProfile ID
		const _electionProfileId = user.electionProfiles.find(profile => profile.isActive === true).electionProfileId;
		if (!_electionProfileId) {
			loggerService.log(req.useragent, 'User Adds voters', 'Failure', 'User has not active election profile');
		}

		const result = voters.map(voter => createVoter(voter, _id, _electionProfileId));
		const resolve = await Promise.all(result);
		const notAddedVoters = resolve.filter(item => item);
		loggerService.log(req.useragent, 'User Adds voters', 'Success', 'New voters were added');
		res.status = 200;
		res.json({
			status: 200,
			message: 'New voters were added',
			notAddedVoters
		});
	} catch (e) {
		loggerService.log(req.useragent, 'User Adds voters', 'Failure', e.stack);
		console.log(e);
		e = e.message || e;
		return errorHandler(e, res, req, next);
	}
};

async function createVoter(voter, _id, _electionProfileId) {
	const potentialVoter = await PotentialVoter.findOne({ id: voter.id });
	if (potentialVoter === null) {
		const voterFromElastic = await getVoterFromElastic(voter.id, voter._index);
		const checkVoter = await Voter.findOne({ elasticId: voter.id });
		if (checkVoter !== null) {
			return { name: `${voterFromElastic.firstname} ${voterFromElastic.lastname}`, elasticId: voter.id };
		}
		if (voterFromElastic.gender === 'M') {
			voterFromElastic.gender = 'Male';
		} else if (voterFromElastic.gender === 'F') {
			voterFromElastic.gender = 'Female';
		} else if (voterFromElastic.gender === 'U') {
			voterFromElastic.gender = 'Unknown';
		}
		voterFromElastic.source = [{
			type: 'elasticSearch'
		}];
		voterFromElastic.elasticId = voterFromElastic.id;
		voterFromElastic.userId = _id;
		voterFromElastic.electionProfileId = _electionProfileId;
		const newVoter = new Voter(voterFromElastic);
		await newVoter.save(err => {
			if (err) {
				console.log(err);
				throw new Error("Internal server error");
			}
			return 0;
		})
	} else {
		const contact = await Contact.findOne({ _id: potentialVoter.contactId });
		const checkVoter = await Voter.findOne({ elasticId: potentialVoter.id });
		if (checkVoter !== null) {
			return { name: `${potentialVoter.firstname} ${potentialVoter.lastname}`, elasticId: potentialVoter.id };
		}
		const { details } = await getVoterFromElastic(potentialVoter.id, potentialVoter._index);
		const newVoter = new Voter({
			userId: _id,
			elasticId: potentialVoter.id,
			firstname: potentialVoter.firstname,
			lastname: potentialVoter.lastname,
			address: potentialVoter.address,
			gender: potentialVoter.gender,
			birthday: potentialVoter.birthday,
			phone: potentialVoter.phone,
			avatar: contact.avatar,
			socialId: contact.socialId,
			source: contact.source,
			voterDesc: contact.voterDesc,
			congressionalDistrict: contact.congressionalDistrict,
			voterStatusDesc: potentialVoter.voterStatusDesc,
			voterStatusReasonDesc: potentialVoter.voterStatusReasonDesc,
			details
		});
		await newVoter.save(async err => {
			if (err) {
				console.log(err);
				throw new Error("Internal server error");
			}
			await PotentialVoter.findOneAndDelete({ id: voter.id }, err => {
				if (err) {
					console.log(err);
					throw new Error("Internal server error");
				}
			})
		});
		return 0;
	}
}

async function convertToJSON(array) {  // function for convert excel to Json
	var first = array[0].join();
	var headers = first.split(',');

	var jsonData = [];
	for (var i = 1, length = array.length; i < length; i++) {

		var myRow = array[i].join();
		var row = myRow.split(',');

		var data = {};
		for (var x = 0; x < row.length; x++) {
			data[headers[x]] = row[x];
		}
		jsonData.push(data);
	}
	return jsonData;
}



