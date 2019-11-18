function login(email, password, callback) {
    const request = require('request');
    const authData = {
        email: email,
        password: password
    };
    request.post({
        url: configuration.BASE_API_URL + '/auth/signin',
        body: authData,
        json: true
        //for more options check:
        //https://github.com/mikeal/request#requestoptions-callback
    }, function (err, response, body) {
        if (err) return callback(err);
        if (body.status != 200) return callback(body.message);
        const user = body.user;

        callback(null, {
            user_id: user.user_id.toString(),
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
        });
    });
}