/**
 *  Created by KennethObikwelu on 8/9/19.
 */


const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const guestUserSchema = new mongoose.Schema({
	firstname: {
		type: String,
		required: [true, 'firstname is required'],
	},
	lastname: {
		type: String,
		required: [true, 'lastname is required'],
	},
	isRegistered: {
		type:Boolean,
		required: [true, 'registration status is required'],
	},
	isNetworkStrong: {
		type: Boolean,
		default: false
	},
	cityOfResidence: {
		type: String,
		required: [true, 'cityOfResidence is required'],
	},
	phoneNumber: String,
	email: {
		type: String,
		required: [true, 'Email is required'],
		validate: [
			{
				validator: (value) => {
					const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
					return emailRegex.test(value);
				},
				message: props => `${props.value} is not a valid email address!`,
			},
		],
	},
	pastRelevantExperience: {
		type: String,
		required: [true, 'experience is required'],
	},
	created: {
		type: Date,
		default: Date.now
	}
})

const GuestUser = db.model('GuestUser', guestUserSchema);

module.exports = GuestUser;