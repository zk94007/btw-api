const config = {
	port: process.env.PORT || 3000,
	mongo: {
		connectionString						 : process.env.MONGO_CONNECTION_STRING,
        host                                     : process.env.MONGO_HOST,
		port                                     : process.env.MONGO_PORT,
		user                                     : process.env.MONGO_USER,
        password                                 : process.env.MONGO_PASSWORD,
        database                                 : process.env.MONGO_DATABASE,
        options                                  : {
            useNewUrlParser: true,
            poolSize: 10,
            keepAlive: 1000,
            connectTimeoutMS: 30000,
        }
	},
	secret: process.env.BTW_TOKEN_SECRET,
	mailgun: {
		api_key  : process.env.MAILGUN_API_KEY,
		from_whom: process.env.MAILGUN_FROM_WHOM,
		domain   : process.env.MAILGUN_DOMAIN
	},
	auth0: {
		domain: process.env.AUTH0_DOMAIN,
		clientId: process.env.AUTH0_CLIENT_ID,
		clientSecret: process.env.AUTH0_CLIENT_SECRET
	},
	task: {
		minNum: process.env.MINIMUM_NUMBER_OF_TASKS,
		maxNum: process.env.MAXIMUM_NUMBER_OF_TASKS
	},

	aws_s3_bucket_name: process.env.AWS_S3_BUCKET_NAME,
	aws_s3_access_key : process.env.AWS_S3_ACCESS_KEY,
	aws_s3_secret_key : process.env.AWS_S3_SECRET_KEY,
	region : process.env.REGION,
	cronTime : process.env.CRON_TIME,
	queue_url : process.env.QUEUE_URL,
	allowed_tasks_count : process.env.ALLOWED_TASKS_COUNT,

	google_civic_api_key: process.env.GOOGLE_CIVIC_API_KEY,
    google_civic_url    : process.env.GOOGLE_CIVIC_URL,

    sentry: {
        publicKey: process.env.SENTRY_PUBLIC_KEY,
        host: process.env.SENTRY_HOST,
        projectId: process.env.SENTRY_PROJECT_ID,
	},
	twitter: {
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		secret_key: process.env.TWITTER_CONSUMER_SECRET,
	},
    elasticNode: process.env.ELASTIC_NODE,
};

/**
 *  Set the current environment or default to 'development'
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
config.env = process.env.NODE_ENV;

module.exports = config;
