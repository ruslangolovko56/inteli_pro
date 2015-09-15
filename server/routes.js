/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var config = require('./config/environment');
var cors = require('cors');

module.exports = function (app) {

    // Insert routes below
    app.use('/api/resultspages', require('./api/resultspage'));
    app.use('/api/site', require('./api/site'));
    app.use('/api/fields', require('./api/field'));
    app.use('/api/esps', require('./api/esp'));
    app.use('/api/markets', require('./api/market'));
    app.use('/api/forms', require('./api/form'));
    app.use('/api/startpages', require('./api/startpage'));
    app.use('/api/leads', require('./api/lead'));
    app.use('/api/quizzes', require('./api/quiz'));
    app.use('/api/results', require('./api/result'));
    app.use('/api/questions', require('./api/question'));
    app.use('/api/s3Policy', require('./api/aws'));
    app.use('/api/users', require('./api/user'));

    app.use('/auth', require('./auth'));

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
        .get(errors[404]);

    // Embed code js route
    app.route('/s/jsEmbed')
        .get(function (req, res) {
            res.render('survey.html', {'host': config.domain});
        });

    // All other routes should redirect to the index.html
    app.route('/*')
        .get(function (req, res) {
            res.sendfile(app.get('appPath') + '/index.html');
        });
};
