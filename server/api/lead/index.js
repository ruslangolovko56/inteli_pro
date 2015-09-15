'use strict';

var express = require('express');
var controller = require('./lead.controller');
var espController = require('../esp/esp.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.put('/:id/finish', controller.finish, espController.createSubscriber);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
