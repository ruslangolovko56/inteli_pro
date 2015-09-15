'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var LeadSchema = new Schema({
  name   : String,
  fields : [{
    field: {type: Schema.ObjectId, ref: 'Field'},
    value: String,
    _id  : false
  }],
  quiz   : {type: Schema.ObjectId, ref: 'Quiz'},
  path   : [{
    id      : Number,
    _id     : false,
    question: {type: Schema.ObjectId, ref: 'Question'},
    answer  : {type: String, default: ''}
  }],
  esps   : [{
    id  : {type: Schema.ObjectId},
    meta: {}
  }],
  resultPages : {type: Schema.ObjectId, ref: 'ResultsPage'},
  url   : String,
  created: {type: Date, default: Date.now},
  completed: {type: Boolean, default: false}
});

module.exports = mongoose.model('Lead', LeadSchema);
