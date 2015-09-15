'use strict';

var mongoose = require('mongoose'),
  Quiz = require('../quiz/quiz.model'),
  Form = require('../form/form.model'),
  Fieldmapping = require('../esp/fieldmapping.model'),
  _ = require('lodash'),
  async = require('async'),
  Schema = mongoose.Schema;
var when = require('when');
var defer = when.defer;

var fieldTypes = ['text', 'email', 'dropdown', 'currency'];

var FieldSchema = new Schema({
  name: String,
  label: String,
  type: String,
  category: String,
  tags: [{
    text: { type: String, lowercase: true, trim: true },
    _id: false
  }],
  param: String,
  user: {type: Schema.ObjectId, ref: 'User'},
  active: {type: Boolean, default: true},
  visible: {type: Boolean, default: true},
  required: {type: Boolean, default: false},
  created: {type: Date, default: Date.now()}
});

// Validate email is not taken
FieldSchema
  .path('name')
  .validate(function (value, respond) {
    var self = this;
    this.constructor.find({
      $or: [{
        name: value,
        user: self.user
      }, {
        name: value,
        category: 'system'
      }]
    }, function (err, field) {
      if (err) throw err;
      if (field.length === 0) {
        return respond(true);
      } else {
        if (field.length > 1) {
          return respond(false);
        } else {
          if (self.id === field[0].id) return respond(true);
          return respond(false);
        }
      }
    });
  }, 'The specified field name is already in use.');

// Validate url parameter label is not taken
FieldSchema
  .path('param')
  .validate(function (value, respond) {
    var self = this;
    this.constructor.find({
      $or: [{
        param: value,
        user: self.user
      }]
    }, function (err, field) {
      if (err) throw err;
      if (field.length === 0) {
        return respond(true);
      } else {
        if (field.length > 1) {
          return respond(false);
        } else {
          if (self.id === field[0].id) return respond(true);
          return respond(false);
        }
      }
    });
  }, 'The specified url parameter label is already taken.');

/**
 * Pre-save hook
 */
FieldSchema
  .pre('save', function (next) {
    if (this.isNew) return next();

    this.isPublished().then(function(isPublished) {
      if (isPublished) {
        next(new Error('Field is already published'));
      } else {
        next();
      }
    }, function(err) {
      next(new Error(err));
    });
  });

FieldSchema
  .pre('remove', function (next) {
    var self = this;

    this.canDelete().then(function(canDelete) {
      if(canDelete) {
        Fieldmapping.find({ 'fields.field': self._id }, function(err, mappings) {
          if(err) {
            return next(new Error(err));
          }
          if(!mappings || mappings.length==0) {
            return next();
          }
          async.each(mappings, function(mapping, callback) {
            _.remove(mapping.fields, function(field) {
              return field.field == self._id.toString();
            });
            mapping.save(function(err) {
              if(err) {
                return callback(err);
              }
              return callback();
            })
          }, function(err) {
            if(err) {
              return next(new Error(err));
            }
            return next();
          });
        });
      } else {
        next(new Error('Field is already published'));
      }
    }, function(err) {
      next(new Error(err));
    });
  });

/**
 * Methods
 */
FieldSchema.methods = {

  /**
   * check field is published or not
   */
  isPublished: function () {
    var self = this;
    var deferred = defer();

    Quiz.find({
      user: this.user,
        form: { $exists: true, $ne: null },
      status: {$ne: 'test'}
    }).lean().populate({
      path: 'form',
      model: 'Form',
      match: {
        fields: self._id
      }
    }).exec(function (err, docs) {
      if (err) {
        deferred.reject(err);
      }
      var doc = _.find(docs, function(doc) {
        return doc.form != null;
      });
      if (doc) {
        deferred.resolve(true);
      } else {
        deferred.resolve(false);
      }
    });

    return deferred.promise;
  },

  /**
   * Check field can be deleted or not
   */
  canDelete: function () {
    var self = this;
    var deferred = defer();

    Form.count({
      fields: self._id
    }).exec(function (err, count) {
      if (err) {
        deferred.reject(err);
      }

      if (count > 0) {
        deferred.resolve(false);
      } else {
        deferred.resolve(true);
      }
    });

    return deferred.promise;
  }
};

module.exports = mongoose.model('Field', FieldSchema);
