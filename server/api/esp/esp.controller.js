'use strict';

var _ = require('lodash');
var Esp = require('./esp.model');
var EspConnection = require('./esp-connection.model');
var Fieldmapping = require('./fieldmapping.model');
var Field = require('../field/field.model');
var Quiz = require('../quiz/quiz.model');
var when = require('when');
var defer = when.defer;
var uuid = require('node-uuid');
var request = require('request');
var config = require('../../config/environment');
var async = require('async');
var util = require('util');

// Get list of esps
exports.index = function (req, res) {
  var userId = req.user._id;
  var includeList = req.query.includeList;
  Esp.find({active: true}, function (err, esps) {
    if (err) {
      return handleError(res, err);
    }
    async.map(esps, function (esp, callback) {
      async.series([
        function (cb) {
          EspConnection.findOne({esp: esp.id, user: userId}, function (err, connection) {
            if (err) {
              return cb(err);
            }
            if (connection) {
              esp.set('connection', connection.connection, {strict: false});
            }
            return cb();
          });
        },
        function (cb) {
          if (includeList === 'true' && esp.get('connection')) {
            createRPC(esp, esp.get('connection'), 'list.query', {}, function (err, lists) {
              if (err) {
                return cb(err);
              }
              esp.set('lists', lists, {strict: false});
              return cb();
            });
          } else {
            return cb();
          }
        }
      ], function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null, esp);
      });
    }, function (err, esps) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, esps);
    });
  });
};

// Get a single esp
exports.show = function (req, res) {
  var userId = req.user._id;
  var includeList = req.query.includeList;

  Esp.findById(req.params.id, function (err, esp) {
    if (err) {
      return handleError(res, err);
    }
    async.series([
      function (cb) {
        EspConnection.findOne({esp: esp.id, user: userId}, function (err, connection) {
          if (err) {
            return cb(err);
          }
          if (connection) {
            esp.set('connection', connection.connection, {strict: false});
          }
          return cb();
        });
      },
      function (cb) {
        if (includeList === 'true' && esp.get('connection')) {
          createRPC(esp, esp.get('connection'), 'list.query', {}, function (err, lists) {
            if (err) {
              return cb(err);
            }
            esp.set('lists', lists, {strict: false});
            return cb();
          });
        } else {
          return cb();
        }
      }
    ], function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(200, esp);
    });
  });
};

// Creates a new esp in the DB.
exports.create = function (req, res) {
  Esp.create(req.body, function (err, esp) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(201, esp);
  });
};

// Updates an existing esp in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Esp.findById(req.params.id, function (err, esp) {
    if (err) {
      return handleError(res, err);
    }
    if (!esp) {
      return res.send(404);
    }
    var updated = _.merge(esp, req.body);
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, esp);
    });
  });
};

// Deletes a esp from the DB.
exports.destroy = function (req, res) {
  Esp.findById(req.params.id, function (err, esp) {
    if (err) {
      return handleError(res, err);
    }
    if (!esp) {
      return res.send(404);
    }
    esp.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

// Creates a new connection via esp-connector.
exports.authenticate = function (req, res) {
  console.log(' [i] ESP Authentication');
  var userId = req.user._id;
  Esp.findById(req.params.id, function (err, esp) {

    // error handle
    if (err) {
      return handleError(res, err);
    }
    if (!esp) {
      return res.send(404);
    }

    // Create rabbitmq channel to connect
    global.rabbitmq.createChannel().then(function (ch) {

      // create correlation id
      var corrId = uuid();

      // create queue name
      var q = 'quiz-app-' + corrId;
      console.log(' [i] correlation id is created to be sent : ', corrId);

      // create queue to receive connection id and set consumer
      var ok = ch.assertQueue(q, {durable: true, expires: 60 * 1000, autoDelete: true});
      ok = ok.then(function (qok) {
        var queue = qok.queue;
        return ch.consume(queue, consumer)
          .then(function () {
            return queue;
          });
      });

      // return calculated url
      ok.then(function (queue) {
        var data = {
          url: config.rabbitmq.server.url + '/#!/auth/' + esp.name.toLowerCase() + '?corrId=' + corrId + '&queue=' + queue + '&app=quiz-app&redirect=' + config.domain + '/settings/lead-collection'
        };
        return res.json(data);
      });

      // consumer that receives connection id from esp-connector
      function consumer(msg) {

        // check empty message
        if (!msg) return;

        // parse message content
        var data = JSON.parse(msg.content.toString());
        console.log(' [i] response message arrived - content : ', data);

        // check message is correct
        if (data.corrId && data.corrId === corrId) {
          console.log(' [i] correlation id matched ! ');

          // remove existing connection from db
          EspConnection.remove({esp: req.params.id, user: userId}, function (err) {

            // error handle
            if (err) {
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer('DB error'),
                {correlationId: msg.properties.correlationId, type: 'error'});
              return ch.ack(msg);
            }

            // create new connection in db
            var espConnection = new EspConnection();
            espConnection.user = userId;
            espConnection.esp = req.params.id;
            espConnection.connection = data.connection;
            espConnection.save(function (err) {

              // error handle
              if (err) {
                ch.sendToQueue(msg.properties.replyTo,
                  new Buffer('DB error'),
                  {correlationId: msg.properties.correlationId, type: 'error'});
                return ch.ack(msg);
              }

              // send result to esp-connector
              ch.sendToQueue(msg.properties.replyTo,
                new Buffer('success'),
                {correlationId: msg.properties.correlationId});
              return ch.ack(msg);
            });
          });
        } else {
          console.log(' [e] correlation id does not match ! ');

          // send failed message
          ch.sendToQueue(msg.properties.replyTo,
            new Buffer('Correlation id does not match'),
            {correlationId: msg.properties.correlationId, type: 'error'});
          return ch.ack(msg);
        }

        // delete queue
        ch.deleteQueue(q);
      };
    }, function (err) {
      return handleError(res, err);
    });

  });

};

// Get form fields from ESP through esp-connector
exports.queryFields = function (req, res) {
  var userId = req.user._id;

  // query esp info from db.
  Esp.findById(req.params.id, function (err, esp) {

    if (err) {
      return handleError(res, err);
    }

    if (!esp) {
      return res.send(404);
    }

    // query connection data from db.
    EspConnection.findOne({user: userId, esp: esp.id}, function (err, conn) {
      if (err) {
        return handleError(res, err);
      }
      if (!conn) {
        return res.send(404);
      }

      // send message to esp-connector
      global.rabbitmq.createChannel().then(function (ch) {

        var ex = 'esp';
        var ok = ch.assertExchange(ex, 'topic', {durable: true});
        var answer = defer();
        var corrId = uuid();

        // callback function
        function maybeAnswer(msg) {
          console.log(' [i] response arrived - correlationId: ', msg.properties.correlationId);
          if (msg.properties.correlationId === corrId) {
            console.log(' [i] response arrived - properties: ', msg.properties);
            if (msg.properties.type && msg.properties.type === "error") {
              answer.reject();
            } else {
              answer.resolve(JSON.parse(msg.content.toString()));
            }
          }
        }

        // create callback queue
        ok = ok.then(function () {
          return ch.assertQueue('', {exclusive: true});
        });

        // set consumer to queue
        ok = ok.then(function (qok) {
          var queue = qok.queue;
          return ch.consume(queue, maybeAnswer, {noAck: true})
            //.then(function() { return ch.bindQueue(queue, ex, 'aweber.authenticate'); })
            .then(function () {
              return queue;
            });
        });

        // publish message to queue
        ok = ok.then(function (queue) {
          console.log(' [x] Requesting data : ' + esp.name.toLowerCase() + '.field.query');
          var data = {
            id: conn.connection
          };
          ch.publish(ex, esp.name.toLowerCase() + '.field.query', new Buffer(JSON.stringify(data)), {
            correlationId: corrId, replyTo: queue
          });
          //ch.sendToQueue(req.params.service + '.authenticate', new Buffer(req.body.toString()), {
          //  correlationId: corrId, replyTo: queue
          //});
          return answer.promise;
        });

        return ok.then(function (data) {
          console.log(' [.] Got ', data);
          return res.json(data);
        }, function () {
          console.log(' [e] Error Occured ');
          return handleError(res, 'Error occured!');
        });
      });
    });

  });

};

// Query field mapping info
exports.queryMapping = function (req, res) {
  var userId = req.user._id;
  var espId = req.params.id;
  Fieldmapping.find({user: userId, esp: espId}, function (err, mappings) {
    if (err) {
      return handleError(res, err);
    }
    if (!mappings) {
      return res.send(404);
    }
    return res.json(mappings);
  });
};

// Creates a new fieldmapping in the DB.
exports.createMapping = function (req, res) {
  if (!req.body.fieldSets) {
    res.send(400);
  }

  var fieldSets = req.body.fieldSets;
  var userId = req.user._id;
  var espId = req.params.id;
  Fieldmapping.remove({user: userId, esp: espId}, function (err) {
    if (err) {
      return handleError(res, err);
    }
    async.each(fieldSets, function (fieldSet, callback) {
      var mapping = new Fieldmapping();
      mapping.user = userId;
      mapping.esp = espId;
      mapping.list = {
        id  : fieldSet.listId,
        name: fieldSet.listName
      };
      mapping.fields = fieldSet.fields;
      mapping.save(function (err) {
        if (err) {
          return callback(err);
        }
        return callback();
      });
    }, function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(200);
    });
  });

};

/**
 * Create a new subscriber via esp-connector
 *
 * @param req
 * @param res
 * @returns {*}
 */
exports.createSubscriber = function (req, res) {

  if (req.body.esps && req.body.esps.length > 0 && req.body.quiz && req.body.fields) {

    if (req.body.fields.length === 0) {
      // No fields to map
      //return res.send(200);
      return;
    }

    // Get user
    Quiz.findById(req.body.quiz, 'user', function (err, quiz) {
      if (err) {
        //return handleError(res, err);
        // error
        return;
      }
      if (!quiz) {
        //return handleError(res, 'Invalid quiz');
        return;
      }

      // Send message per each esp list.
      var userId = quiz.user;
      async.each(req.body.esps, function (esp, callback) {
        EspConnection.findOne({user: userId, esp: esp.id}, function (err, conn) {
          if (err) {
            return callback(err);
          }
          if (!conn) {
            return callback('ESP connection has been setup incorrectly');
          }

          // Field mapping
          console.log(' [x] searching fields : ', req.body.fields);
          async.map(req.body.fields, function (field, cb) {
            Fieldmapping.findOne({
              user          : userId,
              esp           : esp.id,
              'list.id'     : esp.meta.list.id,
              'fields.field': field.field
            }, {'fields.$': 1}, function (err, mapping) {

              if (err) {
                return cb(err);
              }

              if (!mapping) {
                return cb();
              }

              console.log(' [x] field mapping data : ', mapping);

              return cb(null, {
                id   : mapping.fields[0].mapTo.id,
                name : mapping.fields[0].mapTo.name,
                value: field.value
              });

            });
          }, function (err, fields) {

            if (err) {
              return callback(err);
            }

            //query esp data
            Esp.findById(esp.id, function (err, espDetail) {

              if (err) {
                return callback(err);
              }

              if (!esp) {
                return callback(404);
              }

              // send message
              createRPC(espDetail, conn.connection, 'subscriber.create', {
                fields: fields,
                list  : esp.meta.list
              }, function (err) {
                if (err) {
                  return callback(err);
                }
                return callback();
              });
            });

          });
        });
      }, function (err) {
        if (err) {
          //return handleError(res, err);
          return;
        }
        //return res.send(200);
        return;
      });
    });
  }

  return res.send(200)
};

/**
 * Create custom fields in esp.
 * @param req
 * @param res
 */
exports.createFields = function (req, res) {

  // validate request parameters
  req.checkBody('fields', 'Invalid parameter - fields').notEmpty().isArrayLenGt(0);
  req.checkBody('list', 'Invalid parameter - list').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    res.send('There have been validation errors: ' + util.inspect(errors), 400);
    return;
  }

  // request parameter values
  var espId = req.params.id,
      userId = req.user._id,
      fields = req.body.fields,
      prefix = req.body.prefix || '',
      list = req.body.list;

  // find esp data
  Esp.findById(espId, function (err, esp) {
    if (err) {
      return handleError(res, err);
    }
    if (!esp) {
      return res.send(404);
    }

    // find esp connection data
    EspConnection.findOne({user: userId, esp: espId}, function (err, espConnection) {
      if (err) {
        return handleError(res, err);
      }
      if (!espConnection) {
        return handleError(res, 'Esp connection is not yet established !');
      }

      // iterate each field and get field data.
      async.mapSeries(fields, function (field, callback) {
        console.log(field);
        Field.findOne({_id: field}).or([{category: 'system'}, {user: userId}]).lean().exec(function (err, field) {
          if (err) {
            return callback(err);
          }
          console.log(field);
          if (!field) {
            return callback('Field - ' + field.name + ' is not found !');
          }

          // send results to esp-connector to create fields
          var fieldName = prefix !== '' ? prefix + '_' + field.name : field.name;
          createRPC(esp, espConnection.connection, 'field.create', {
            list    : {
              listId: list.listId,
              listName: list.listName
            },
            name    : fieldName,
            label   : field.label,
            type    : field.type,
            required: field.required
          }, function (err, espField) {
            if (err) {
              return callback(err);
            }

            // assign esp field to mapped field in field object
            delete espField.list;
            field.mappedField = espField;

            callback(null, field);
          });

        });
      }, function (err, results) {
        if (err) {
          return handleError(res, err);
        }

        return res.json(results);
      });
    })
  });
};

exports.cancelConnection = function(req, res) {
  var userId = req.user._id;

  EspConnection.remove({esp: req.params.id, user: userId}, function (err) {
    if (err) {
      return res.json(err);
    }
    return res.json({result: 'success'});
  });
};

/**
 * Abstract function for remote procedure call to esp-connector
 * @param esp
 * @param conn
 * @param proc
 * @param queryString
 * @param callback
 */
function createRPC(esp, conn, proc, queryString, callback) {
  global.rabbitmq.createChannel().then(function (ch) {

    var ex = 'esp';
    var ok = ch.assertExchange(ex, 'topic', {durable: true});
    var answer = defer();
    var corrId = uuid();

    // callback function
    function maybeAnswer(msg) {
      console.log(' [i] response arrived - correlationId: ', msg.properties.correlationId);
      if (msg.properties.correlationId === corrId) {
        console.log(' [i] response arrived - properties: ', msg.properties);
        if (msg.properties.type && msg.properties.type === "error") {
          answer.reject(JSON.parse(msg.content.toString()));
        } else {
          answer.resolve(JSON.parse(msg.content.toString()));
        }
      }
    }

    // create callback queue
    ok = ok.then(function () {
      return ch.assertQueue('', {exclusive: true});
    });

    // set consumer to queue
    ok = ok.then(function (qok) {
      var queue = qok.queue;
      return ch.consume(queue, maybeAnswer, {noAck: true})
        .then(function () {
          return queue;
        });
    });

    // publish message to queue
    ok = ok.then(function (queue) {
      console.log(' [x] Requesting data : ' + esp.name.toLowerCase() + '.' + proc);
      var data = {
        id    : conn,
        params: queryString
      };
      try {
        var published = ch.publish(ex, esp.name.toLowerCase() + '.' + proc, new Buffer(JSON.stringify(data)), {
          correlationId: corrId, replyTo: queue
        });
      }
      catch (err) {
        answer.reject();
      }
      return answer.promise;
    });

    return ok.then(function (data) {
      console.log(' [.] Got ', data);
      return callback(null, data);
    }, function (err) {
      err = err || 'can not process request';
      console.log(' [e] Error Occured : ', err);
      return callback(err);
    });
  });
}



function handleError(res, err) {
  return res.send(500, err);
}
