'use strict';

var express = require('express');
var controller = require('./aws.controller');

var router = express.Router();

router.get('/:mimeType', controller.gets3Policy);

module.exports = router;