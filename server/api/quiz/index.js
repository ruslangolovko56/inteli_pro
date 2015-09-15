'use strict';

var express = require('express');
var controller = require('./quiz.controller');
var auth = require('../../auth/auth.service');
var leadController = require('../lead/lead.controller');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/stats', auth.isAuthenticated(), controller.getStats);
router.get('/:id', controller.show);
router.get('/:id/survey', controller.survey);
router.get('/:id/leads', auth.isAuthenticated(), leadController.getLeadsPerQuiz);
router.post('/', controller.create);
router.put('/:id/land', controller.land);
router.put('/:id/complete', controller.complete);
router.put('/:id/activate', auth.isAuthenticated(), controller.activate);
router.put('/:id/deactivate', auth.isAuthenticated(), controller.deactivate);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
