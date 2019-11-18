function socialSignup(user, context, callback) {
    const request = require('request');

    function removeUser(userId, cb) {
        const deleteUserApiUrl = auth0.baseUrl + '/users/';
        request.post({
            url: `https://${configuration.BASE_DOMAIN}/oauth/token`,
            json: {
                client_id: configuration.CLIENT_ID,
                client_secret: configuration.CLIENT_SECRET,
                audience: `https://${configuration.BASE_DOMAIN}/api/v2/`,
                grant_type: 'client_credentials'
            }
        }, function (error, response, body) {
            console.log(body);
            request.delete({
                url: deleteUserApiUrl + encodeURIComponent(userId),
                headers: {
                    Authorization: 'Bearer ' + body.access_token
                },
            }, function (err, res, bd) {
                cb();
            });
        });
    }

    // Skip email-pass auths
    if (user.user_id.indexOf('auth0') !== -1) {
        return callback(null, user, context);
    }

    if (!user.email && !user.email_verified) {
        return callback(new Error('Email is required for signup!'));
    }

    request.post({
            url: configuration.BASE_API_URL + '/auth/getUser',
            json: {
                email: user.email,
                social: true,
                userId: user.user_id
            },
        },
        function (err, response, body) {
            if (err) {
                removeUser(user.user_id, function () {
                    return callback(err);
                });
                return;
            }
            if (response.statusCode === 200) {
                request.post({
                    url: configuration.BASE_API_URL + '/auth/signin',
                    body: {
                        email: user.email,
                        social: true,
                        userId: user.user_id
                    },
                    json: true
                }, function (err, response, body) {
                    if (err) {
                        removeUser(user.user_id, function () {
                            return callback(err);
                        });
                        return;
                    }
                    if (response.statusCode !== 200) {
                        removeUser(user.user_id, function () {
                            return callback(new Error(body.message));
                        });
                        return;
                    }
                    return callback(null, user, context);
                });
            } else if (response.statusCode === 404) {
                console.log('[-] Creating user in database');
                request.post({
                    url: configuration.BASE_API_URL + '/auth/signup',
                    body: {
                        email: user.email,
                        password: '',
                        social: true,
                        userId: user.user_id
                    },
                    json: true
                }, function (err, response, body) {
                    if (err) {
                        removeUser(user.user_id, function () {
                            return callback(err);
                        });
                        return;
                    }
                    if (response.statusCode !== 200) {
                        removeUser(user.user_id, function () {
                            return callback(new Error(body.message));
                        });
                        return;
                    }
                    return callback(null, user, context);
                });
            } else {
                removeUser(user.user_id, function () {
                    return callback(new Error(body.message));
                });
                return;
            }
        });
}
