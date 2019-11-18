/**
 *  Created by KennethObikwelu on 8/12/19.
 */


const {expect} = require('chai');

const mongoose = require('mongoose');
const db = require('../dbConnect').get();


const subscriptionSchema = new mongoose.Schema({

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
			{
				validator: (value)=>{
					Subscription.count({"email": value.email}, (err, count)=>{
						if (count>0){
							return false
						}
					})
				},
				message: props => `${props.value} has already subscribed`,
			}
		],
	},
	created: {
		type: Date,
		default: Date.now
	}
})

const Subscription = db.model('Subscription', subscriptionSchema);

module.exports = Subscription;