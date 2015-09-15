'use strict';

var express = require('express');
var controller = require('./field.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/all', auth.isAuthenticated(), controller.queryAll);
router.get('/form', auth.isAuthenticated(), controller.queryForm);
router.get('/:id/custom', auth.isAuthenticated(), controller.customFields);
router.get('/:id/system', controller.systemFields);
router.get('/:id/form', auth.isAuthenticated(), controller.formFields);
router.get('/:id/answer', auth.isAuthenticated(), controller.answerFields);
router.get('/:id', controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/queryByParams', controller.queryByParams);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;
