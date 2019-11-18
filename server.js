const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const useragent = require('express-useragent');
const logger = require('morgan');
const RateLimit = require('express-rate-limit');
const device = require('express-device');
const Sentry = require('@sentry/node');
const cron = require('node-cron');
const config = require('./config');
const db = require('./dbConnect');
const authApi = require('./services/auth0api');
const { checkDistricts } = require('./services/civicApi');
const taskService = require('./services/taskService');

const app = express();

if (process.env.NEW_RELIC_ENABLED === 'true') {
    require('newrelic');
}

/**
 * Connect to mongo DB
 */
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    console.log('Found sentry credentials, using it');
    Sentry.init({ dsn: `https://${config.sentry.publicKey}@${config.sentry.host}/${config.sentry.projectId}` });
}

checkDistricts();

/**
 * Middleware
 */
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(fileUpload());
app.use(device.capture());
app.use(logger('combined'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(useragent.express());

app.enable('trust proxy');


const limiter = new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 4500, // limit each IP to 100 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
});

// apply to all requests
//may need to ration access based on specific roles
app.use(limiter);

app.all('/*', (req, res, next) => {
    // CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,Authorization,X-Access-Token,X-Key,Auth0-Client');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
});

app.use('/', require('./routes/index'));

// If no route is matched by now, it must be a 404
app.use((req, res, next) => {
    const err = new Error('No resource found');
    err.status = 404;
    next(err);
});
// Start the server
app.set('port', process.env.PORT || 4252);

const server = app.listen(app.get('port'), () => {
    console.log('###########################################################################################');
    console.log('###########################################################################################');
    console.log(`Express server listening on port ${server.address().port}`);
    console.log(`This is a  ${process.env.NODE_ENV} server`);
    console.log('Property of be the wave');

    console.log('Attempting to connect to db .........');
    db.connect();

    console.log('Attempting to init Auth0 API .........');
    authApi.init();
});

cron.schedule(`${config.cronTime}`, function () {
    console.log("running cron job");
    try {
       taskService.createTasksForVoter();
    } catch (ex) {
        console.log(ex);
    }
});


function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
}

module.exports = app;
