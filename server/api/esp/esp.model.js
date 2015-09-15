'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EspSchema = new Schema({
  name: String,
  info: String,
  logo: String,
  active: Boolean
});

module.exports = mongoose.model('Esp', EspSchema);
