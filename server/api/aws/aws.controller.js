'use strict';

var AWS = require('aws-sdk'),
    crypto = require('crypto'),
    config = require('../../config/environment'),
    createS3Policy,
    getExpiryTime;

// Get expiry time.
getExpiryTime = function () {
    var _date = new Date();
    return '' + (_date.getFullYear()) + '-' + (_date.getMonth() + 1) + '-' +
        (_date.getDate() + 1) + 'T' + (_date.getHours() + 3) + ':' + '00:00.000Z';
};

// Create s3Credentials.
createS3Policy = function(contentType, callback) {
    contentType = decodeURIComponent(contentType);
    var date = new Date();
    var s3Policy = {
        'expiration': getExpiryTime(),
        'conditions': [
            ['starts-with', '$key', 'upload/'],
            {'bucket': config.aws.bucket},
            {'acl': 'public-read'},
            ['starts-with', '$Content-Type', contentType],
            {'success_action_status' : '201'}
        ]
    };

    // stringify and encode the policy
    var stringPolicy = JSON.stringify(s3Policy);
    var base64Policy = new Buffer(stringPolicy, 'utf-8').toString('base64');

    // sign the base64 encoded policy
    var signature = crypto.createHmac('sha1', config.aws.secretAccessKey)
        .update(new Buffer(base64Policy, 'utf-8')).digest('base64');

    // build the results object
    var s3Credentials = {
        s3Policy: base64Policy,
        s3Signature: signature,
        AWSAccessKeyId: config.aws.accessKeyId,
        bucket: config.aws.bucket
    };

    // send it back
    callback(s3Credentials);
};


// Get credentials for s3Bucket.
exports.gets3Policy = function(req, res) {
    createS3Policy(req.params.mimeType, function (creds, err) {
        if (!err) {
            return res.send(200, creds);
        } else {
            return res.send(500, err);
        }
    });
};

function handleError(res, err) {
  return res.send(500, err);
}