const AWS = require('aws-sdk');
const helper = require('../utility/helper')();
const SentryLogger = require('../utility/SentryLogger');
const config = require('../config');
const loggerService = require('../services/loggerService');

const accessKeyId = config.aws_s3_access_key;
const secretAccessKey = config.aws_s3_secret_key;
const region = config.region;

AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region
});

var s3 = new AWS.S3();

exports.uploadFile = async (req, res) => {
    console.log('uploading image');
    if (!req.files) {
        loggerService.log(req.useragent,'User uploads a file ','Failure','No image is found in request');
        return helper.response(404, 'No image is found in request', res);
    }
    else if (req.files) {
        if (!req.files.image) {
            loggerService.log(req.useragent,'User uploads a file ','Failure','This error occurred because the file name is image but the user has given other name for upload file');
            return helper.response(400, 'This error occurred because the file name is image but the user has given other name for upload file', res);
        }
        const fileType = `${req.files.image.mimetype}`;
        if (!fileType.includes('image')) {
            loggerService.log(req.useragent,'User uploads a file ','Failure','File requested to upload is not an image');
            return helper.response(400, 'File requested to upload is not an image', res);
        }
        const name = req.files.image.name;
        const data = req.files.image.data;
        const fileSize = data.length;
        const maxSize = 5 * 1024 * 1024;
        if (fileSize > maxSize) {
            loggerService.log(req.useragent,'User uploads a file ','Failure','Image requested to upload exceeds in size');
            return helper.response(400, 'Image requested to upload exceeds in size', res);
        }
        try {
            const params = {
                Bucket: config.aws_s3_bucket_name,
                Key: name,
                ACL: 'public-read',
                Body: data
            };

            s3.upload(params, (err, data) => {
                if (err) {
                    console.log("Error: ", err);
                    SentryLogger.log(err);
                } else {
                    console.log(data);
                    loggerService.log(req.useragent,'User uploads a file ','Success','Image uploaded Successfully!');
                    res.json({ success: true, message: "Image uploaded Successfully!", imageUrl: data.Location });
                }
            });
        } catch (ex) {
            loggerService.log(req.useragent,'User uploads a file ','Failure',ex.message);
            console.log("Error: ", ex);
            SentryLogger.log(ex);
        }
    }
};
