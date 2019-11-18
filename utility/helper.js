/**
 *  Created by KennethObikwelu on 3/23/18.
 */


let jwt = require('jwt-simple');
let config = require('../config');
let validator = require('validator');


module.exports = function () {

    const isEmptyObject = (obj) => {
      return Object.entries(obj).length === 0 && obj.constructor === Object;
    };

    const response = (status, message, res) => {
        res.status(status);
        res.json({
            "status": status,
            "message": message
        });
    }
    const errorResponse = (status, error, errorDescription, businessErrorCode, res) => {
        res.status(status);
        const errorObj = {
            error: error,
            errorDescription: errorDescription,
            businessErrorCode: businessErrorCode
        };
        res.json({
            "status": status,
            "message": JSON.stringify(errorObj),
        });
    }
    const getTokenInRequest = (req) => {
        return (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
    }

    const isTokenInformationComplete = (token) => {
        let decoded = jwt.decode(token, config.secret);
        return decoded.userid && decoded.email
    }
    const isValidEmail = (email) => {
        return validator.isEmail(email);
    }

    const isValidMobileNumber = (phoneNumber) => {
        return validator.isMobilePhone(phoneNumber, 'en-US')
    }

    const isStrengthPassword = (password) => {
        const minPasswordLength = 8;
        const minNumberOfVariation = 3;
        const variations = {
            digits: /\d/.test(password),
            lower: /[a-z]/.test(password),
            upper: /[A-Z]/.test(password),
            nonWords: /\W/.test(password),
        };

        if (password.length >= minPasswordLength) {
            const score = Object.values(variations).reduce((prev, next) => prev + next);
            if (score >= minNumberOfVariation) {
                return true;
            }
        }
        return false;
    };

    return {
        response,
        errorResponse,
        getTokenInRequest,
        isTokenInformationComplete,
        isValidEmail,
        isValidMobileNumber,
        isStrengthPassword
    }
}
