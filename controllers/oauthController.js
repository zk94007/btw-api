const { google } = require('googleapis');
const helper = require('../utility/helper')();
const { FB } = require('fb');
const oAuth2 = google.auth.OAuth2;
const User = require('../models/User');
const twitterService = require('../services/twitter');
const loggerService = require('../services/loggerService');

exports.getTwitterRequestToken = async (req, res) => {

    const { oauthToken, error } = await twitterService.getRequestToken();
    if (error) {
        return res.json({
            "status": 500,
            token: null,
            error: error,
        });
    }

    res.json({
        "status": 200,
        token: oauthToken,
    });
};

exports.getTwitterFriends = async (req, res) => {
    const { oauth_token, oauth_verifier } = req.query;
    await twitterService.getFriends(oauth_token, oauth_verifier, req.user, res);
};


function getAddress(connection) {
    if (connection.address) {
        return {
            poBox: connection.address[0].poBox ? connection.address[0].poBox : null,
            streetAddress: connection.address[0].streetAddress ? connection.address[0].streetAddress : null,
            extendedAddress: connection.address[0].extendedAddress ? connection.address[0].extendedAddress : null,
            city: connection.address[0].city ? connection.address[0].city : null,
            region: connection.address[0].region ? connection.address[0].region : null,
            postalCode: connection.address[0].postalCode ? connection.address[0].postalCode : null,
            country: connection.address[0].country ? connection.address[0].country : null,
            countryCode: connection.address[0].countryCode ? connection.address[0].countryCode : null,
            toString: ()=>{return `${this.poBox}, ${this.streetAddress}, ${this.extendedAddress}, ${this.city}, ${this.region},
            ${this.postalCode}, ${this.country}, ${this.countryCode}`},
        }

    } else {
        return {
            poBox: null,
            streetAddress: null,
            extendedAddress: null,
            city: null,
            region: null,
            postalCode: null,
            country: null,
            countryCode: null,
            toString: ()=>{return null}
        }
    }
}

function getBirthDay(connection) {
    let birthday = "";
    if (connection.birthdays) {
        if (connection.birthdays[0].data) {
            if (connection.birthdays[0].data.month.length === 1) {
                birthday = `0${connection.birthday[0].data.month}`;
            } else {
                birthday = connection.birthday[0].data.month;
            }
            if (connection.birthdays[0].data.day.length === 1) {
                birthday = birthday + `0${connection.birthday[0].data.day}`;
            } else {
                birthday = birthday + connection.birthday[0].data.day;
            }
            if (connection.birthdays[0].data.year.length === 1) {
                birthday = birthday + `0${connection.birthday[0].data.year}`;
            } else {
                birthday = birthday + connection.birthday[0].data.year;
            }
        } else {
            return null
        }
    } else {
        return null
    }
    return birthday;
}

function importContacts(people, cursor, req) {
    return new Promise((resolve, reject) => {
        people.people.connections.list({
            resourceName: 'people/me',
            personFields: 'emailAddresses,names,birthdays,locales,phoneNumbers,addresses',
            pageToken: cursor === -1 ? null : cursor,
            pageSize: 2000,
        }, (error, response) => {
            if (error) {
                loggerService.log(req.useragent,'User imports contacts via social media','Failure',error.stack);
                reject(error);
            }
            loggerService.log(req.useragent,'User imports contacts via social media','Success','Successfully Imported Contacts');
            resolve(response);
        });
    });
}

exports.importUserFromGoogle = async (req, res) => {
    const start= new Date().getTime();
    const { access_token } = req.query;
    const oauth2ClientGoogle = new oAuth2();
    oauth2ClientGoogle.setCredentials({ access_token: access_token });
    const people = google.people({
        version: 'v1',
        auth: oauth2ClientGoogle,
    });
    const currentUser = await User.findOne({ email: req.user['https://bethewave.vote'].email });
    let cursor = -1;
    let arrayOfPromises = [];
    let response = null;
    while (cursor !== 0) {
        try {
            response = await importContacts(people, cursor, req);
        } catch (error) {
            return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
        }
        if (!response.data.connections) {
            return helper.response(200, 'Action completed, but contacts not found', res);
        }
        for (const connection of response.data.connections) {
            const normalizedUser = {
                userId: currentUser._id,
                firstname: connection.names ? connection.names[0].givenName : null,
                lastname: connection.names ? connection.names[0].familyName : null,
                address: getAddress(connection).toString(),
                socialId: connection.resourceName,
                birthday: getBirthDay(connection),
                phone: connection.phoneNumbers ? connection.phoneNumbers[0].value : '',
                source: [{
                    type: 'social',
                    name: 'Google'
                }]
            };
            arrayOfPromises.push(twitterService.getPotentialVoters(normalizedUser));
            cursor = response.data.nextPageToken || 0;
        }
    }
    await Promise.all(arrayOfPromises);
    const end = new Date().getTime();
    return helper.response(200, `Action completed. Time: ${end - start}ms`, res)
};

exports.importUserFromFacebook = async (req, res) => {
    const access_token = req.body.access_token;
    FB.setAccessToken(access_token);
    FB.api('me/friends', 'get', (response) => {
        if (!response.error) {
            res.status(200);
            res.json({
                "status": 200,
                "friends": response.friends,
            });
        } else {
            return helper.response(500, res.friends, res);
        }
    });
};
