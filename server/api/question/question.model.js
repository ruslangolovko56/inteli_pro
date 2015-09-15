'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var QuestionSchema = new Schema({
  user      : {type: Schema.ObjectId, ref: 'User'},
  attachment: {
    bucket  : String,
    etag    : String,
    key     : String,
    location: String
  },
  text      : String,
  tags      : [{
    text: {type: String, lowercase: true, trim: true},
    _id : false
  }],
  type      : {
    id  : String,
    text: String
  },
  answers   : [{
    text      : String,
    attachment: {
      bucket  : String,
      etag    : String,
      key     : String,
      location: String
    },
    fields    : [{
      field: {type: Schema.ObjectId, ref: 'Field'},
      value: String,
      _id  : false
    }],
    enable    : {type: Boolean, default: true}
  }],
  created   : {type: Date, default: Date.now},
  updated   : {type: Date, default: Date.now}
});

QuestionSchema
  .virtual('strTag')
  .get(function () {
    var strTag = "";
    this.tags.forEach(function (tag) {
      strTag += tag.text + " ";
    });
    return strTag;
  })

module.exports = mongoose.model('Question', QuestionSchema);
