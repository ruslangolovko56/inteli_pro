'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var MarketSchema = new Schema({
  name: String,
  user: {type: Schema.ObjectId, ref: 'User'},
  createdAt: {type: Date, default: Date.now},
  active: {type: Boolean, default: true}
});

module.exports = mongoose.model('Market', MarketSchema);
