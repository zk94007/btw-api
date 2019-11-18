function create(user, callback) {
    const request = require('request');
    request.post({
        url: configuration.BASE_API_URL + '/auth/signup',
        body: user,
        json: true
        //for more options check:
        //https://github.com/mikeal/request#requestoptions-callback
    }, function (err, response, body) {
        if (err) return callback(err);
        if (body.status !== 200) return callback(body.message);
        callback(null);
    });
}