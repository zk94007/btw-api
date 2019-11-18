const User = require('../models/User');
const helper = require('../utility/helper')();
const loggerService = require('../services/loggerService');
const SentryLogger = require('../utility/SentryLogger');
const errorHandler = require('../errorHandler');
const UserElectionProfile = require('../models/UserElectionProfile');



exports.updateUserComment = async (req, res) => {
	try {
		const { email } = req.user['https://bethewave.vote'];
		const { modifiedText } = req.body;
		const { commentId } = req.params;
		await User.updateOne({ email, "comments._id": commentId }, { $set: { "comments.$.text": modifiedText } });
		return helper.response(200, 'Comment was edited!', res);
	} catch (e) {
		console.log(e);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.deleteUserComment = async (req, res) => {
	try {
		const { email } = req.user['https://bethewave.vote'];
		const { commentId } = req.params;
		await User.updateOne({ email }, { $pull: { comments: { _id: commentId } } });
		return helper.response(200, 'Comment was deleted!', res);
	} catch (e) {
		console.log(e);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.addUserComment = async (req, res) => {
	try {
		const { email } = req.user['https://bethewave.vote'];
		const { comment } = req.body;
		await User.updateOne({ email }, { $push: { comments: comment } });
		return helper.response(200, 'Comments was added!', res);
	} catch (error) {
		SentryLogger.log(error);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};



exports.updateUserV2 = async (req, res) => {
	const allowedKeys = [
		'firstname',
		'lastname',
		'address',
		'zipcode',
		'phoneNumber',
		'dateOfBirth',
		'profileImageUrl',
		'bioInfo',
		'welcomeDashboardShown'
	];

	try {
		const { email } = req.user["https://bethewave.vote"];
		const user = await User.findOne({ email });

		Object.entries(req.body).forEach(([key, value]) => {
			if (allowedKeys.includes(key)) {
				user[key] = value;
			}
		});
		await user.save();
		return res
			.status(200)
			.json({
				status: 200,
				message: 'User updated successfully',
				user: {
					id: user._id,
					email: user.email,
					firstname: user.firstname,
					lastname: user.lastname,
					welcomeDashboardShown: user.welcomeDashboardShown,
					points: user.points,
					userProfile: {
						address: user.profile.address,
						zipcode: user.profile.zipcode,
						phoneNumber: user.profile.phoneNumber,
						bioInfo: user.profile.bioInfo,
						dateOfBirth: user.profile.dateOfBirth,
						profileImageUrl: user.profile.profileImageUrl
					}
				}
			});
	} catch (error) {
		SentryLogger.log(error);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.getUserV2 = async (req, res, next) => {
	try {
		const { email } = req.user["https://bethewave.vote"];
		const user = await User.findOne({ email }).lean();
		res.json({
			status: 200,
			message: "User found successfully",
			user: {
				id: user._id,
				email: user.email,
				firstname: user.firstname,
				lastname: user.lastname,
				welcomeDashboardShown: user.welcomeDashboardShown,
				registrationDate: user.registrationDate,
				lastLoginTime: user.lastLoginTime,
				points: user.points,
				isEmailConfirmed: user.isEmailConfirmed,
				isProfileComplete: user.isProfileComplete,
				userProfile: {
					address: user.profile.address,
					zipcode: user.profile.zipcode,
					phoneNumber: user.profile.phoneNumber,
					bioInfo: user.profile.bioInfo,
					dateOfBirth: user.profile.dateOfBirth,
					profileImageUrl: user.profile.profileImageUrl
				}
			}
		});
	} catch (error) {
		SentryLogger.log(error);
		error = error.message || error;
		return errorHandler(error, res, req, next);
	}
};


exports.getUserElectionProfiles = async (req, res) => {
	try {
		const { email } = req.user["https://bethewave.vote"];
		const user = await User.findOne({ email }).lean();

		let electionProfiles = [];
		try {
			electionProfiles = await UserElectionProfile.find({ userId: user._id });
		} catch (ex) {
			console.log(ex);
		}
		if (electionProfiles.length === 0) {
			return helper.response(200, 'No Election Profiles present for the requested user', res);
		}

		res.json({
			status: 200,
			message: "Profile found successfully",
			user: {
				id: user._id,
				maxElectionProfiles: {
					role: user.maxElectionProfiles.role,
					count: user.maxElectionProfiles.count
				},
				electionProfiles
			}
		});
	} catch (error) {
		console.log(error);
		SentryLogger.log(error);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.addUserElectionProfile = async (req, res) => {
	try {
		const { email } = req.user['https://bethewave.vote'];
		const electionProfile = Object.assign({}, req.body);

		const user = await User.findOne({ email }).lean();
		electionProfile.userId = user._id;

		const newElectionProfile = new UserElectionProfile(electionProfile);
		await newElectionProfile.save(err => {
			if (err) {
				console.log(err);
				throw new Error("Internal server error");
			}
			return 0;
		})
		return helper.response(200, 'new profile was added!', res);
	} catch (error) {
		console.log(error);
		SentryLogger.log(error);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};

exports.updateUserElectionProfile = async (req, res) => {
	const {electionProfileId} = req.params;
	try {
		let electionProfile = await UserElectionProfile.findById(electionProfileId);
		if (electionProfile === null) {
			loggerService.log(req.useragent, 'User edits election profile', 'Failure', 'Election profile with that id was not found!');
			return helper.response(200, 'Election profile with that id was not found!', res);
		}
		var query = { _id: electionProfile };
		await UserElectionProfile.update(query, { $set: req.body });
		loggerService.log(req.useragent, 'User edits election profile', 'Success', 'Election profile updated successfully');
		return helper.response(200, 'Election profile updated successfully', res);
	} catch (error) {
		loggerService.log(req.useragent, 'User edits election profile', 'Failure', error.message);
		SentryLogger.log(error);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
	}
};