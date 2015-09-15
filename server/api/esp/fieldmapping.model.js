'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var FieldmappingSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'User'},
  esp: {type: Schema.ObjectId, ref: 'Esp'},
  list: {
    id: {type: String},
    name: {type: String}
  },
  fields: [{
    field: {type: Schema.ObjectId, ref: 'Field'},
    mapTo: {
      id: {type: String},
      name: {type: String},
      type: {type: String},
      required: {type: Boolean}
    },
    _id: false
  }],
  created: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('Fieldmapping', FieldmappingSchema);
