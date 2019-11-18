/**
 *  Created by KennethObikwelu on 9/12/19.
 */



const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const electionProfileSchema = new mongoose.Schema({
	state: String,
	governorship: {
		type: Boolean,
		default: false
	},
    federalStateWideRaces: {
		senate: {
			type: Boolean,
			default: false
		},
	    houseOfRepresentatives: {
		    type: Boolean,
		    default: false
	    }
    },
	stateWideRaces: {
		senate: {
			type: Boolean,
			default: false
		},
		houseOfRepresentatives: {
			type: Boolean,
			default: false
		}
	},
	municipalities: [
		String
	],
	created: {
		type: Date,
		default: Date.now
	}
});


const ElectionProfile = db.model('ElectionProfile', electionProfileSchema);

module.exports = ElectionProfile;
