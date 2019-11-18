const Sentry = require('@sentry/node');
const config = require('../config');

const log = (err) => {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
        console.log('Found sentry credentials, using it');
        Sentry.init({ dsn: `https://${config.sentry.publicKey}@${config.sentry.host}/${config.sentry.projectId}` });
        Sentry.captureException(err);
    }    
    return "";
}

module.exports = { log };