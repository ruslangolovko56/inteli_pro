'use strict';

var express = require('express');
var controller = require('./result.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.post('/survey', controller.survey);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;