'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
    if (!process.env[name]) {
        throw new Error('You must set the ' + name + ' environment variable');
    }
    return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
    env: process.env.NODE_ENV,

    // Domain
    domain: process.env.DOMAIN || 'http://localhost:9000',

    // Root path of server
    root: path.normalize(__dirname + '/../../..'),

    // Server port
    port: process.env.PORT || 9000,

    // Should we populate the DB with sample data?
    seedDB: false,

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'quiz-app-secret'
    },

    // List of user roles
    userRoles: ['guest', 'user', 'admin'],

    // MongoDB connection options
    mongo: {
        options: {
            db: {
                safe: true
            }
        }
    },

    facebook: {
        clientID: process.env.FACEBOOK_ID || 'id',
        clientSecret: process.env.FACEBOOK_SECRET || 'secret',
        callbackURL: process.env.DOMAIN + '/auth/facebook/callback'
    },

    twitter: {
        clientID: process.env.TWITTER_ID || 'id',
        clientSecret: process.env.TWITTER_SECRET || 'secret',
        callbackURL: process.env.DOMAIN + '/auth/twitter/callback'
    },

    google: {
        clientID: process.env.GOOGLE_ID || 'id',
        clientSecret: process.env.GOOGLE_SECRET || 'secret',
        callbackURL: process.env.DOMAIN + '/auth/google/callback'
    },

    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAIJDE4LEZDW7J74PA',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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',
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_BUCKET || 'quiz-app-nik'
    },

    fields: {
        types: ['textarea', 'text', 'number', 'email', 'url']
    }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
    all,
        require('./' + process.env.NODE_ENV + '.js') || {});
