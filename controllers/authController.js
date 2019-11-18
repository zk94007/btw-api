const bcrypt = require('bcrypt');
const uuid = require('uuid/v4');

const helper = require('../utility/helper')();
const auth0 = require('../services/auth0api').get();
const User = require('../models/User');
const {sendResetPasswordEmail, sendActivationEmail} = require('../services/sendEmail');
const errorHandler = require('../errorHandler');
const config = require('../config');
const loggerService = require('../services/loggerService');
const SentryLogger = require('../utility/SentryLogger');

const SALT_ROUNDS = 10;



exports.signUp = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const social = req.body.social || false;
    const userId = req.body.userId;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;

    const count = await User.countDocuments({email});

    if (count > 0) {
        if(social){
            loggerService.log(req.useragent,'User signup','registration_failed','Sorry, we cannot register you with this social media account. You may have registered with another social media account with the same email.');
            return helper.errorResponse(400, 'registration_failed',
                'Sorry, we cannot register you with this social media account. You may have registered with another social media account with the same email.',
                'BE-104', res);
        }
        loggerService.log(req.useragent,'User signup','registration_failed','Sorry, we cannot register you with this email. If you are not sure of your password, attempt to reset it or use another unique email');
        return helper.errorResponse(400, 'registration_failed',
                'Sorry, we cannot register you with this email. If you are not sure of your password, attempt to reset it or use another unique email',
                'BE-103', res);
    }

    try {
        const user = await User.create({
            email,
            password: social ? '' : await bcrypt.hash(password, SALT_ROUNDS),
            socialLogin: social,
            firstname,
            lastname
        });
        if (!social) {
            user.auth0UserId = `auth0|${user._id.toString()}`;
        } else {
            user.auth0UserId = userId;
        }
        await user.save();

        loggerService.log(req.useragent,'User signup','Success','Account created successfully');
        res.status(200);
        res.json({
            status: 200,
            message: 'Account created successfully',
            user: {
                user_id: user._id.toString(),
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                points: user.points,
                onboarding: user.onboarding
            },
        });
    } catch (error) {
        loggerService.log(req.useragent,'User signup','Failure',error.message);
	    SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105' ,res);
    }
};

exports.signUpV2 = async (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	const social = req.body.social || false;
	const userId = req.body.userId;
	const firstname = req.body.firstname;
	const lastname = req.body.lastname;

	const count = await User.countDocuments({email});

	if (count > 0) {
		if(social){
			loggerService.log(req.useragent,'User signup','registration_failed','Sorry, we cannot register you with this social media account. You may have registered with another social media account with the same email.');
			return helper.errorResponse(400, 'registration_failed',
				'Sorry, we cannot register you with this social media account. You may have registered with another social media account with the same email.',
				'BE-104', res);
		}
		loggerService.log(req.useragent,'User signup','registration_failed','Sorry, we cannot register you with this email. If you are not sure of your password, attempt to reset it or use another unique email');
		return helper.errorResponse(400, 'registration_failed',
			'Sorry, we cannot register you with this email. If you are not sure of your password, attempt to reset it or use another unique email',
			'BE-103', res);
	}

	try {
		const user = await User.create({
			email,
			password: social ? '' : await bcrypt.hash(password, SALT_ROUNDS),
			socialLogin: social,
			firstname,
			lastname
		});
		if (!social) {
			user.auth0UserId = `auth0|${user._id.toString()}`;
		} else {
			user.auth0UserId = userId;
		}
		await user.save();

		loggerService.log(req.useragent,'User Signup','Success','Account created successfully');
		res.status(200);
		res.json({
			status: 200,
			message: 'Account created successfully',
			user: {
				user_id: user._id.toString(),
				email                : user.email,
				firstname            : user.firstname,
				lastname             : user.lastname,
				welcomeDashboardShown: user.welcomeDashboardShown,
				registrationDate     : user.registrationDate,
				lastLoginTime        : user.lastLoginTime,
				points               : user.points,
				isEmailConfirmed     : user.isEmailConfirmed,
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
		loggerService.log(req.useragent,'User Signup','Failure',error.message);
		SentryLogger.log(error);
		return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105' ,res);
	}
};

exports.signIn = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const social = req.body.social || false;
    const userId = req.body.userId;

    let user = null;
    if (social) {
        user = await User.findOne({socialLogin: social, auth0UserId: userId}).byEmail(email);
    } else {
        user = await User.findOne({socialLogin: false}).byEmail(email);
    }

    if (user === null) {
        return helper.errorResponse(401, "access_denied",
            'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive',
            "BE-102", res);
    }
    if (!social) {
        const compareResult = await bcrypt.compare(password, user.password);
        if (!compareResult) {
            return helper.errorResponse(401,'access_denied',
                'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive', "BE-101" ,res);
        }
    }

    user.lastLoginTime = new Date();
    user.markModified('lastLoginTime');
    await user.save();

    res.status(200);
    res.json({
        status: 200,
        message: 'Successful signin',
        user: {
            user_id: user._id.toString(),
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            welcomeDashboardShown: user.welcomeDashboardShown
        },
    });
};

exports.signInV2 = async (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	const social = req.body.social || false;
	const userId = req.body.userId;

	let user = null;
	if (social) {
		user = await User.findOne({socialLogin: social, auth0UserId: userId}).byEmail(email);
	} else {
		user = await User.findOne({socialLogin: false}).byEmail(email);
	}

	if (user === null) {
		return helper.errorResponse(401, "access_denied",
			'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive',
			"BE-102", res);
	}
	if (!social) {
		const compareResult = await bcrypt.compare(password, user.password);
		if (!compareResult) {
			return helper.errorResponse(401,'access_denied',
				'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive', "BE-101" ,res);
		}
	}

	user.lastLoginTime = new Date();
	user.markModified('lastLoginTime');
	await user.save();

	res.status(200);
	res.json({
		status: 200,
		message: 'Authentication successful',
		user: {
			email                : user.email,
			firstname            : user.firstname,
			lastname             : user.lastname,
			welcomeDashboardShown: user.welcomeDashboardShown,
			registrationDate     : user.registrationDate,
			lastLoginTime        : user.lastLoginTime,
			points               : user.points,
			isEmailConfirmed     : user.isEmailConfirmed,
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
};

exports.getUser = async (req, res) => {
    const email = req.body.email;
    const social = req.body.social || false;

    let user = null;
    if (social) {
        const userId = req.body.userId;
        user = await User.findOne({socialLogin: social, auth0UserId: userId}).byEmail(email);
    } else {
        user = await User.findOne({socialLogin: false}).byEmail(email);
    }

    if (user === null) {
        return helper.errorResponse(404, 'access_denied', 'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive'
            ,'BE-101', res);
    }

    res.status(200);
    res.json({
        status: 200,
        message: 'User found',
        user: {
            user_id: user._id.toString(),
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            fullname: user.fullName,
            onboarding: user.onboarding,
            welcomeDashboardShown: user.welcomeDashboardShown
        },
    });
    //TODO: maybe need to add additional fields later
};

exports.verifyEmail = async (req, res) => {
    const email = req.body.email;

    const user = await User.findOne({isEmailConfirmed: false}).byEmail(email);

    if (user === null) {
        return helper.errorResponse(401, 'access_denied', 'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive',
            'BE-102', res);
    }

    try {
        user.isEmailConfirmed = true;
        await user.save();
        return helper.response(200, 'Email verified successfully', res);
    } catch (error) {
	    SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable','Something went wrong, please try again later','BE-105', res);
    }
};

exports.changeOldPassword = async (req, res) => {
  try{
    const { email } = req.user["https://bethewave.vote"];
    const user = await User.findOne({ email });
    const { newPassword, oldPassword } = req.body;
    if (user === null) {
      return helper.errorResponse(401, 'access_denied', 'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive',
          'BE-102', res);
    }
    const compareResult = await bcrypt.compare(oldPassword, user.password);
    if (!compareResult) {
      return helper.errorResponse(401, 'access_denied', 'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive',
          'BE-102', res);
    } else {
      user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await user.save();
      return helper.response(200, 'Password changed successfully', res);
    }
  } catch (e) {
    e = e.message || e;
    return errorHandler(e, res, req);
  }
};

exports.changePassword = async (req, res) => {
    const email = req.body.email;
    const newPassword = req.body.newPassword;

    const user = await User.findOne().byEmail(email);

    if (user === null) {
        return helper.errorResponse(401, 'access_denied', 'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive',
            'BE-102', res);
    }

    try {
        user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await user.save();
        return helper.response(200, 'Password changed successfully', res);
    } catch (error) {
        SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable','Something went wrong, please try again later','BE-105', res);
    }
};

exports.removeUser = async (req, res) => {
    const user_id = req.body.user_id;

    if (!user_id.match(/^[0-9a-fA-F]{24}$/)) {
        return helper.response(400, 'Invalid user id format', res);
    }

    const user = await User.findById(user_id);

    if (user === null) {
        return helper.response(404, 'User with that id was not found!', res);
    }

    try {
        await user.remove();
        return helper.response(200, 'User removed successfully', res);
    } catch (error) {
	    SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable','Something went wrong, please try again later','BE-105', res);
    }
};

exports.sendVerificationEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ isEmailConfirmed: false }).byEmail(email);

        if (user === null) {
            return helper.errorResponse(401, 'access_denied', 'Sorry, The email and password you entered don\'t match our records. Password fields may be case sensitive',
                'BE-102', res);
        }

        if (user.socialLogin) {
            return helper.response(200, `Verification email not required`, res);

        }

        const activationLink = await auth0.management.createEmailVerificationTicket({
            user_id: `auth0|${user._id}`,
        });
        await sendActivationEmail(email, activationLink.ticket);
        return helper.response(200, 'Verification email sent successfully', res);
    } catch (error) {
	    SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable','Something went wrong, please try again later','BE-105', res);
    }
};

exports.sendResetPasswordEmail = async (req, res) => {
    const {email} = req.body;
    try {
        const user = await User.findOne({email});
        if (user === null) {
            return helper.response(404, 'user not found', res);
        }

        const SECONDS_IN_ONE_DAY = 1000 * 60 * 60 * 24;
        user.resetPasswordToken = uuid();
        user.resetPasswordExpires = Date.now() + SECONDS_IN_ONE_DAY * 5;
        await user.save();

        const resetPasswordLink = `${config.Origin_frontend}/change_password/change/${user.resetPasswordToken}`;
        await sendResetPasswordEmail(email, resetPasswordLink);

        return helper.response(200, 'Request processed successfully', res);
    } catch (error) {
	    SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable','Something went wrong, please try again later','BE-105', res);
    }
};

exports.checkResetPasswordToken = async (req, res) => {
    const {resetPasswordToken} = req.params;
    try {
        const user = await User.findOne({resetPasswordToken, resetPasswordExpires: {$gt: Date.now()}});
        if (!user) {
            return res
                .status(404)
                .json({
                    status: 404,
                    message: 'Password reset token is invalid or has expired',
                    isValid: false,
                });
        }

        return res
            .status(200)
            .json({
                status: 200,
                message: 'Reset password token is valid',
                isValid: true,
            });
    } catch (error) {
	    SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable','Something went wrong, please try again later','BE-105', res);
    }
};

exports.resetPassword = async (req, res) => {
    const {newPassword, resetPasswordToken} = req.body;
    try {
        if (!helper.isStrengthPassword(newPassword)) {
            loggerService.log(req.useragent,'User reset password','Failure','Password must be at least 8 characters in length and contain 3 of the following '
            + '4 types of characters: lower case letters (a-z), uppercase letters (A-Z), numbers (0-9), '
            + 'special characters (e.g. !@#$%^&*)',);
            return helper.response(
                400,
                'Password must be at least 8 characters in length and contain 3 of the following '
                + '4 types of characters: lower case letters (a-z), uppercase letters (A-Z), numbers (0-9), '
                + 'special characters (e.g. !@#$%^&*)',
                res,
            );
        }

        const user = await User.findOne({resetPasswordToken, resetPasswordExpires: {$gt: Date.now()}});
        if (!user) {
            loggerService.log(req.useragent,'User reset password','Failure','Password reset token is invalid or has expired');
            return helper.response(404, 'Password reset token is invalid or has expired', res);
        }

        user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        loggerService.log(req.useragent,'User reset password','Success','Password restored successfully');
        return helper.response(200, 'Password restored successfully', res);
    } catch (error) {
        loggerService.log(req.useragent,'User reset password','Failure',error.message);
	    SentryLogger.log(error);
        return helper.errorResponse(500, 'service_unavailable','Something went wrong, please try again later','BE-105', res);
    }
};
