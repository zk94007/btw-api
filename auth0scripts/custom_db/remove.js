function remove(user_id, callback) {
    const request = require('request');
    request.post({
        url: configuration.BASE_API_URL + '/auth/removeUser',
        body: {
            user_id: user_id
        },
        json: true
        //for more options check:
        //https://github.com/mikeal/request#requestoptions-callback
    }, function (err, response, body) {
        if (err) return callback(err);
        if (body.status != 200) return callback(new Error(body.message));
        callback(null);
    });
}