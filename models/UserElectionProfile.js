const mongoose = require('mongoose');
const db = require('../dbConnect').get();

const userElectionProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    onBoarding: {
        stateElectionType: {
            isCompleted: {
                type: Boolean,
                default: false
            },
            state: {
                type: String,
                default: ''
            },
            federalSenateDistrict: {
                type: String,
                default: ''
            },
            federalHouseDistrict: {
                type: String,
                default: ''
            },
            stateSenateDistrict: {
                type: String,
                default: ''
            },
            stateHouseDistrict: {
                type: String,
                default: ''
            },
            municipalCity: {
                type: String,
                default: ''
            },
            municipalCounty: {
                type: String,
                default: ''
            }
        },
        eligibleToVoteIn2018: {
            isCompleted: {
                type: Boolean,
                default: false
            },
            answer: {
                type: Boolean,
                default: false
            }
        },
        importSource: {
            isCompleted: Boolean,
            default: false,
        },
        addTenVoters: {
            isCompleted: Boolean,
            default: false,
        }
    },
    lastUsedTime: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: false
    }
});

const UserElectionProfile = db.model('UserElectionProfile', userElectionProfileSchema);

module.exports = UserElectionProfile;
