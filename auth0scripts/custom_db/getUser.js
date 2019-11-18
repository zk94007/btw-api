function getByEmail(email, callback) {
    const request = require('request');
    request.post({
        url: configuration.BASE_API_URL + '/auth/getUser',
        body: {
            email: email
        },
        json: true
        //for more options check:
        //https://github.com/mikeal/request#requestoptions-callback
    }, function (err, response, body) {
        if (err) return callback(err);
        if (body.status == 404) return callback(null);
        if (body.status != 200) return callback(new Error(body.message));
        const user = body.user
        callback(null, {
            user_id: user.user_id.toString(),
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            fullname: user.fullname
        });
    });
}