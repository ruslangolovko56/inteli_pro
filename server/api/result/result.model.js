'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ResultSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'User'},
  attachment: {
    bucket: String,
    etag: String,
    key: String,
    location: String
  },
  description: String,
  title: String,
  tags: [{
    text: {type: String, lowercase: true, trim: true},
    _id: false
  }],
  created: {type: Date, default: Date.now},
  updated: {type: Date, default: Date.now}
});

ResultSchema
  .virtual('strTag')
  .get(function () {
    var strTag = "";
    this.tags.forEach(function (tag) {
      strTag += tag.text + " ";
    });
    return strTag;
  });

module.exports = mongoose.model('Result', ResultSchema);
