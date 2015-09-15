'use strict';

var express = require('express');
var controller = require('./site.controller');

var router = express.Router();

router.get('/domain', controller.getDomain);
router.get('/fieldTypes', controller.getFieldTypes);

module.exports = router;
