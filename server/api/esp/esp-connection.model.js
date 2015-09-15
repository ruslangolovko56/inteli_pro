'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var EspConnectionSchema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User' },
  esp: { type: Schema.ObjectId, ref: 'Esp' },
  connection: String,
  created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EspConnection', EspConnectionSchema);
