'use strict';

var express = require('express');
var controller = require('./esp.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.index);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id/fields', auth.isAuthenticated(), controller.queryFields);
router.get('/:id/fieldmapping', auth.isAuthenticated(), controller.queryMapping);
router.post('/',auth.isAuthenticated(), auth.hasRole('admin'), controller.create);
router.post('/:id/auth', auth.isAuthenticated(), controller.authenticate);
router.post('/:id/fieldmapping', auth.isAuthenticated(), controller.createMapping);
router.post('/:id/fields', auth.isAuthenticated(), controller.createFields);
router.put('/:id', auth.isAuthenticated(), auth.hasRole('admin'), controller.update);
router.patch('/:id', auth.isAuthenticated(), auth.hasRole('admin'), controller.update);
router.delete('/:id', auth.isAuthenticated(), auth.hasRole('admin'), controller.destroy);
router.delete('/:id/espconnection', auth.isAuthenticated(), controller.cancelConnection)

module.exports = router;
