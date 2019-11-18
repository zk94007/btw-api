const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const contactSchema = new mongoose.Schema({
	userId               : {
		type    : mongoose.Schema.Types.ObjectId,
		ref     : 'User',
		required: true
	},
	firstname            : String,
	lastname             : String,
	address              : String,
	birthday             : String,
	phone                : String,
	gender               : String,
	voterDesc            : String,
	congressionalDistrict: String,
	avatar               : String,
	maxScore             : Number,
	socialId             : String,
	source               : [{
		type: {
			type: String
		},
		name: String
	}]
});

const Contact = db.model('Contact', contactSchema);

module.exports = Contact;
