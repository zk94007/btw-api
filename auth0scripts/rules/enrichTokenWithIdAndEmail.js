function enrichTokenWithIdAndEmail(user, context, callback) {
    const namespace = "https://bethewave.vote";
    context.accessToken[namespace] = {
        email: user.email,
    };
    context.idToken[namespace] = {
        email: user.email,
    };

    callback(null, user, context);
}
