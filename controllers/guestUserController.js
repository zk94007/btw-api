/**
 *  Created by KennethObikwelu on 8/9/19.
 */



const helper = require('../utility/helper')();
const GuestUser = require('../models/GuestUser');
const Subscription = require('../models/Subscription');
const SentryLogger = require('../utility/SentryLogger');
const mongoose = require('mongoose');


exports.addNewGuestUser = async (req, res) => {
	const { firstname, lastname, isRegistered, isNetworkStrong, cityOfResidence,
		      phoneNumber, email, pastRelevantExperience } = req.body;
	try {
		let newUser = await GuestUser.create({
			firstname             : firstname,
			lastname              : lastname,
			isRegistered          : isRegistered,
			isNetworkStrong       : isNetworkStrong,
			cityOfResidence       : cityOfResidence,
			phoneNumber           : phoneNumber,
			email                 : email,
			pastRelevantExperience: pastRelevantExperience
		});
		await newUser.save();
		res.status(200);
		res.json({
			message: 'Message received! We will contact you shortly'
		})
	} catch (error) {
		SentryLogger.log(error);
		if (error instanceof mongoose.Error.ValidationError) {
			return helper.response(400, 'A required field is missing First Name, Last Name, Email, City, Registration status or Experience', res);
		} else {
			return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
		}
	}
}

exports.subscribeToNewsletter = async (req, res) => {
	const { email } = req.body;

	try {
		let newSubscription = await Subscription.create({
			email: email
		});
		await newSubscription.save();
		res.status(200);
		res.json({
			message: 'Subscription successful!'
		})
	} catch (error) {
		SentryLogger.log(error);
		if (error instanceof mongoose.Error.ValidationError) {
			return helper.response(400, 'A required field is missing Email', res);
		} else {
			return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
		}
	}

}