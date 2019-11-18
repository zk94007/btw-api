const mongoose = require('mongoose');
const mongoConfig = require('../config').mongo;
const db = require('../dbConnect').get();

const userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    password: String,
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
    role: {
        type: String, // TODO: Implement enum with user roles, and default role
    },
    socialLogin: {
        type: Boolean,
        default: false,
    },
    auth0UserId: {
        type: String,
    },
	isEmailConfirmed: {
		type: Boolean,
		default: false,
	},
    profile:{
	    address: {
		    type: String,
		    default: ''
	    },
	    zipcode: {
		    type: String,
		    default: ''
	    },
	    phoneNumber: {
		    type: String,
		    default: ''
	    },
	    profileImageUrl: {
		    type: String,
		    default: ''
	    },
	    bioInfo: {
		    type: String,
		    default: ''
	    },
	    dateOfBirth: {
		    type: String,
		    default: ''
	    },
	    comments:[{
		    text: String,
		    images: [""],
		    createdAt: {
			    type: Date,
			    default: Date.now
		    }
	    }]
    },
    newTasksWaiting: Boolean,
    points: {
        type: Number,
        default: 0,
    },
    lastLoginTime: Date,
    registrationDate: Date,
	resetPasswordToken: String,
	resetPasswordExpires: Date,
    welcomeDashboardShown: {
        type: Boolean,
        default: false,
    },
    isSubscribed: {
        type: Boolean,
        default: true,
    },
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
    maxElectionProfiles:{
      role: {
          type: String,
          default: 'captain'
      },
      count: {
          type: Number,
          default: 2
      }
    }
});

userSchema.pre('save', function (next) {
    if (this.isNew) {
        this.registrationDate = new Date();
        this.markModified('registrationDate');
    }
    next();
});

userSchema.pre('update', function (next) {
	if (this.electionProfiles['isActive']) {
		this.electionProfiles['lastUsedTime'] = new Date();
		this.markModified('electionProfiles[\'lastUsedTime\']');
	}
	next();
});

userSchema.query.byEmail = function (email) {
    return this.where({ email });
};

userSchema.virtual('fullName').get(function () {
    return `${this.firstname} ${this.lastname}`;
});

const User = db.model('User', userSchema);

module.exports = User;
