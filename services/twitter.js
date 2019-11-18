const axios = require('axios');
const oauth = require('oauth');
const Twitter = require('twitter');
const Contact = require('../models/Contact');
const PotentialVoter = require('../models/PotentialVoter');
const User = require('../models/User');
const config = require('../config');
const helper = require('../utility/helper')();
const { findVoter2 } = require('../controllers/elasticController');



let consumer = getConsumer();

function getConsumer() {
    return new oauth.OAuth(
        'https://twitter.com/oauth/request_token',
        'https://twitter.com/oauth/access_token',
        config.twitter.consumer_key,
        config.twitter.secret_key,
        '1.0A',
        `${config.Origin_frontend}/connect_twitter`,
        'HMAC-SHA1',
    );
}

exports.connect = async () => {
    try {
        return await axios({
            url: 'https://api.twitter.com/oauth2/token?grant_type=client_credentials',
            method: 'post',
            auth: {
                username: config.twitter.consumer_key,
                password: config.twitter.secret_key,
            },
        });
    } catch (e) {
        console.log(e);
    }
};

exports.getRequestToken = () => {
    consumer = consumer || getConsumer();
    return new Promise((resolve, reject) => {
        consumer.getOAuthRequestToken((error, oauthToken, oauthTokenSecret, results) => {
            if (error) {
                resolve({ oauthToken: null, error });
            } else {
                resolve({ oauthToken, error: null });
            }
        });
    })
};

function getAccessToken(token, oauth_verifier) {
    consumer = consumer || getConsumer();
    return new Promise((resolve, reject) => {
        consumer.getOAuthAccessToken(token, null, oauth_verifier, (error, oauthAccessToken, oauthAccessTokenSecret) => {
            if (error) {
                resolve({ oauthAccessToken: null, oauthAccessTokenSecret: null, error });
            } else {
                resolve({oauthAccessToken, oauthAccessTokenSecret, error: null });
            }
        });
    })
}

exports.getAccessToken = getAccessToken;

function importContacts(client, cursor) {
    return new Promise(async (resolve, reject) => {
        client.get('friends/list', { cursor: cursor, count: 200 }, (error, friends, response) => {
            if (error) {
                reject(error);
            }
            resolve(friends);
        });
    });
}

exports.getPotentialVoters = async (normalizedUser, userId) => {
     try {
        const contact = new Contact(normalizedUser);
        if (!contact.userId) {
          contact.userId = userId;
        };
        const { potentialVoters } = await findVoter2(normalizedUser);
        if (potentialVoters.length) {
          contact.maxScore = potentialVoters[0]._score;
          await contact.save();
          potentialVoters.forEach(potentialVoter => {
            potentialVoter.contactId = contact._id;
            if (potentialVoter.gender === 'M') {
              potentialVoter.gender = 'Male';
            } else if (potentialVoter.gender === 'F') {
              potentialVoter.gender = 'Female';
            } else if (potentialVoter.gender === 'Unknown') {
              potentialVoter.gender = 'Unknown';
            }
          });
          await PotentialVoter.insertMany(potentialVoters, { ordered: false });
        } else {
          contact.maxScore = 0;
          await contact.save();
        }
      } catch (e) {
        console.log(e);
      }
};


exports.getFriends = async (token, oauth_verifier, captain, res) => {
    const start= new Date().getTime();
    const { oauthAccessToken, oauthAccessTokenSecret, error } = await getAccessToken(token, oauth_verifier);
    if (error) {
        return helper.errorResponse(500, 'service_unavailable', error, '', res);
    }
    const client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: oauthAccessToken,
        access_token_secret: oauthAccessTokenSecret,
    });
    const currentUser = await User.findOne({ email: captain['https://bethewave.vote'].email });
    let cursor = -1;
    let friends = null;
    let arrayOfPromises = [];
    while (cursor !== 0) {
        try {
            friends = await importContacts(client, cursor);
        } catch (error){
            return helper.errorResponse(500, 'service_unavailable', 'Something went wrong, please try again later', 'BE-105', res);
        }
        if (friends.users.length === 0){
            return helper.response(200, 'Action completed, but contacts not found', res );
        }
        for (const user of friends.users) {

            const normalizedUser = {
                firstname: user.name.split(' ')[0],
                lastname: user.name.split(' ')[1],
                userId: currentUser._id,
                phone: null,
                birthday: null,
                socialId: user.id,
                address: user.location,
                source: [{
                    type: 'social',
                    name: 'Twitter'            }]
            };
            arrayOfPromises.push(this.getPotentialVoters(normalizedUser));
        }
        cursor = friends.next_cursor;
    }
    await Promise.all(arrayOfPromises);
    const end = new Date().getTime();
    console.log(`SecondWay: ${end - start}ms`);
    return helper.response(200, `Action completed. Time: ${end - start}ms`, res);
};
