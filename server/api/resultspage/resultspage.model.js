'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ResultspageSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'User'},
  name: String,
  description: String,
  tags: [
    {
      text: {type: String, lowercase: true, trim: true},
      _id: false
    }
  ],
  results: [{type: Schema.ObjectId, ref: 'Result'}],
  beforeResults: String,
  afterResults: String,
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now},
  active: {type: Boolean, default: true}
});

ResultspageSchema
  .virtual('strTag')
  .get(function () {
    var strTag = "";
    this.tags.forEach(function (tag) {
      strTag += tag.text + " ";
    });
    return strTag;
  })

module.exports = mongoose.model('Resultspage', ResultspageSchema);
