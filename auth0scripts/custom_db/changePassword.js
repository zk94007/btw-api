function changePassword(email, newPassword, callback) {
    const request = require('request');
    request.post({
        url: configuration.BASE_API_URL + '/auth/changePassword',
        body: {
            email: email,
            newPassword: newPassword
        },
        json: true
        //for more options check:
        //https://github.com/mikeal/request#requestoptions-callback
    }, function (err, response, body) {
        if (err) return callback(err);
        if (body.status != 200) return callback(new Error(body.message));

        callback(null, true);
    });
}