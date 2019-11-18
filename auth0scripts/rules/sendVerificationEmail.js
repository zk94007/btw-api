function sendVerificationEmail(user, context, callback) {
    user.app_metadata = user.app_metadata || {};

    if (user.app_metadata.signedUp) {
        return callback(null, user, context);
    }

    const request = require('request');

    request.post({
        url: configuration.BASE_API_URL + '/auth/sendVerificationEmail',
        json: {
            email: user.email
        }
    }, function (err, response, body) {
        if (err) return callback(err);
        if (response.statusCode !== 200) return callback(new Error(body.message));

        user.app_metadata.signedUp = true;
        auth0.users.updateAppMetadata(user.user_id, user.app_metadata)
            .then(function () {
                callback(null, user, context);
            })
            .catch(function (err) {
                callback(err);
            });
    });
}
