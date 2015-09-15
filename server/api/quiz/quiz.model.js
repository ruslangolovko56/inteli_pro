'use strict';

var mongoose     = require('mongoose'),
    Schema       = mongoose.Schema,
    _            = require('lodash'),
    Form         = require('../form/form.model'),
    FieldMapping = require('../esp/fieldmapping.model'),
    async        = require('async');

var QuizSchema = new Schema({
  user          : {type: Schema.ObjectId, ref: 'User'},
  title         : String,
  description   : String,
  tags          : [
    {
      text: {type: String, lowercase: true, trim: true},
      _id : false
    }
  ],
  market        : {type: Schema.ObjectId, ref: 'Market'},
  chartDataModel: {
    nodes      : [
      {
        dataId: Schema.ObjectId,
        x     : Number,
        y     : Number,
        id    : Number,
        type  : {type: String},
        meta  : {},
        _id   : false
      }
    ],
    connections: [
      {
        source: {
          nodeId     : Number,
          connectorId: {type: Schema.ObjectId}
        },
        dest  : {
          nodeId: Number
        },
        _id   : false
      }
    ]
  },
  //startPage: { type: Schema.ObjectId, ref: 'Startpage' },
  //form: { type: Schema.ObjectId, ref: 'Form' },
  hasButton     : {type: Boolean, default: false},
  landed        : {type: Number, default: 0},
  completed     : {type: Number, default: 0},
  created       : {type: Date, default: Date.now},
  updated       : {type: Date, default: Date.now},
  cost          : {type: Number, default: 0},
  costUpdatedAt : {type: Date},
  startedAt     : Date,
  status        : {type: String, default: 'test'}
});

/**
 * Methods
 */
QuizSchema.methods = {
  // Find form fields.
  findForm            : function (nodeId) {
    var conn = _.find(this.chartDataModel.connections, function (connection) {
      return connection.dest.nodeId == nodeId;
    });

    var prev = _.find(this.chartDataModel.nodes, function (node) {
      return node.id == conn.source.nodeId;
    })

    if (prev.type == 'form') {
      return prev.dataId;
    } else if (prev.type == 'esp') {
      return this.findForm(prev.id);
    } else {
      return '';
    }
  },

  // Validate on esp field mapping.
  validateFieldMapping: function (cb) {
    var valid = true;
    var that = this;

    async.each(that.chartDataModel.nodes, function (node, callback) {
      if (node.type == 'esp' && valid) {

        console.log(node);

        if (node.meta && node.meta.list && node.meta.list.id) {
          FieldMapping.findOne({
            esp      : node.dataId,
            'list.id': node.meta.list.id
          }, 'fields', function (err, fieldMapping) {
            if (err) {
              return callback(err);
            }

            console.log(fieldMapping);

            if (!fieldMapping) {
              valid = false;
              return callback();
            } else {
              var formId = that.findForm(node.id);

              console.log(formId);

              if (formId != '') {
                Form.findById(formId, function (err, form) {
                  if (err) {
                    return callback(err);
                  }

                  console.log(form);

                  if (!form) {
                    valid = false;
                    return callback();
                  } else {
                    form.fields.every(function (field) {
                      var index = _.findIndex(fieldMapping.fields, function (mappingField) {
                        return mappingField.field.toString() == field.toString();
                      });

                      if (index == -1) {
                        console.log(field);
                        valid = false;
                      }

                      return valid;
                    });

                    return callback();
                  }
                });
              } else {
                valid = false;
                return callback();
              }
            }
          });
        } else {
          valid = false;
          return callback();
        }
      } else {
        return callback();
      }
    }, function (err) {
      if (err) {
        return cb(err);
      }

      return cb(null, valid);
    });
  },

  // Validate on Data Model.
  validateDataModel   : function () {
    var valid = true;
    var root, rootCount = 0;
    var that = this;

    if (this.chartDataModel.nodes.length == 0) {
      return false;
    }

    this.chartDataModel.nodes.every(function (node) {
      var source = _.findIndex(that.chartDataModel.connections, function (connection) {
        return connection.source.nodeId == node.id;
      });

      var dest = _.findIndex(that.chartDataModel.connections, function (connection) {
        return connection.dest.nodeId == node.id;
      });

      if (source == -1 && dest == -1) {
        valid = false;
      } else if (source != -1 && dest == -1 && root != node.dataId) {
        root = node.dataId;
        rootCount++;
      }

      if (valid) {
        return true;
      } else {
        return false;
      }
    });

    if (valid) {
      this.chartDataModel.connections.every(function (connection) {
        var dest = _.findIndex(that.chartDataModel.nodes, function (node) {
          return node.id == connection.dest.nodeId;
        });

        var source = _.findIndex(that.chartDataModel.nodes, function (node) {
          return node.id == connection.source.nodeId;
        });

        switch (dest.type) {
          case 'startPage':
            valid = false;
            break;
          case 'question':
            if (source.type != 'question' && source.type != 'startPage') {
              valid = false;
            }
            break;
          case 'form':
            if (source.type != 'question') {
              valid = false;
            }
            break;
          case 'resultsPage':
            if (source.type != 'esp' && source.type != 'form' && source.type != 'question') {
              valid = false;
            }
            break;
          case 'esp':
            if (source.type != 'form') {
              valid = false;
            }
            break;
        }

        if (valid) {
          return true;
        } else {
          return false;
        }
      });
    }

    if (valid && rootCount > 1) {
      valid = false;
    }

    return valid;
  }
};

QuizSchema.set('toJSON', {virtuals: true});

module.exports = mongoose.model('Quiz', QuizSchema);
