'use strict';

var _ = require('lodash');
var Lead = require('./lead.model');
var Quiz = require('../quiz/quiz.model');
var EspController = require('../esp/esp.controller');
var paginate = require('node-paginate-anything');
var mongoose = require('mongoose');

// Get list of leads
exports.index = function (req, res) {
  var userId = req.user._id;
  var quizQuery = [{
    user: userId
  }];
  var leadQuery = [];
  var fields = [];

  console.log(' [x] request query : ', req.query);

  for (var key in req.query) {
    if (req.query.hasOwnProperty(key)) {
      var con = JSON.parse(req.query[key]);

      var q;
      switch (con.condition) {
        case '=':
          if (con.type == 'date') {
            var value = new Date(con.value);
            q = {
              "$gte": value,
              "$lt": new Date(value.getTime() + (24 * 60 * 60 * 1000))
            };
          } else {
            q = con.value;
          }
          break;
        case 'Contains':
          q = new RegExp('.*' + con.value + '.*', "i");
          break;
        case 'Not':
          if (con.type == 'date') {
            var value = new Date(con.value);
            q = {
              $not: {
                "$gte": value,
                "$lt": new Date(value.getTime() + (24 * 60 * 60 * 1000))
              }
            };
          } else {
            q = {$ne: con.value};
          }
          break;
        case '>':
          if (con.type == 'date') {
            var value = new Date(con.value);
            q = {
              "$gte": new Date(value.getTime() + (24 * 60 * 60 * 1000))
            };
          } else {
            q = {$gte: con.value};
          }
          break;
        case '<':
          if (con.type == 'date') {
            q = {
              "$lt": new Date(con.value)
            };
          } else {
            q = {$lt: con.value};
          }
          break;
      }

      if (con.systemId) {
        switch (con.systemId) {
          case 'quiz_name':
            quizQuery.push({title: q});
            break;
          case 'completion_date':
            leadQuery.push({created: q});
            break;
        }
      } else if (con.fieldId) {
        fields.push({
          $elemMatch: {
            field: mongoose.Types.ObjectId(con.fieldId.toString()),
            value: q
          }
        });
      }
    }
  }

  // only and operation allowed
  quizQuery = {
    $and: quizQuery
  };

  console.log(' [x] Quiz query string : ', quizQuery);

  if (fields.length > 0) {
    leadQuery.push({
      fields: {
        $all: fields
      }
    });
  }

  // quiz count
  Quiz.find(quizQuery, '_id', function (err, quizzes) {
    if (err) {
      return handleError(res, err);
    }

    // get array of quiz ids
    var quizIds = quizzes.map(function (quiz) {
      return quiz._id;
    });

    //var query = {
    //  quiz: {$in: quizIds}
    //};

    leadQuery.push({quiz: {$in: quizIds}});
    leadQuery.push({completed: true});

    leadQuery = {
      $and: leadQuery
    };
    console.log(' [x] Lead query string : ', leadQuery);

    //if (req.query.searchKeywords != '') {
    //  query['fields.value'] = new RegExp('.*' + req.query.searchKeywords + '.*', "i");
    //}

    Lead.count(leadQuery, function (err, count) {
      if (err) {
        return handleError(res, err);
      }

      if (count == 0) {
        return res.json(200, []);
      }

      var queryParameters = paginate(req, res, count, 10);

      if (!queryParameters) {
        return handleError(res, 'Something went wrong!');
      }

      // query leads within quizzes selected
      Lead.find(leadQuery).limit(queryParameters.limit).skip(queryParameters.skip).sort('-created').populate('quiz').populate({
        path: 'fields.field',
        match: {name: 'email'},
        select: 'name'
      }).populate({
        path: 'path.question'
      }).exec(function (err, leads) {
        if (err) return handleError(res, err);
        _.map(leads, function (lead) {
          lead.set('email', '', {strict: false});
          _.forEach(lead.fields, function (field) {
            if (field.field && field.field.name == 'email') {
              lead.set('email', field.value, {strict: false});
            }
          });
          //_.map(lead.path, function(path) {
          //  var answer = _.find(path.question.answers, function(answer) {
          //    return answer._id == path.answer;
          //  });
          //  path.answer = answer;
          //  return path;
          //});
          return lead;
        });
        return res.json(200, leads);
      });
    });
  });
};

// Get a single lead
exports.show = function (req, res) {
  Lead.findById(req.params.id, function (err, lead) {
    if (err) {
      return handleError(res, err);
    }
    if (!lead) {
      return res.send(404);
    }
    return res.json(lead);
  });
};

// Creates a new lead in the DB.
exports.create = function (req, res, next) {
  Lead.create(req.body, function (err, lead) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(lead);
  });
};

// Updates an existing lead in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Lead.findById(req.params.id, function (err, lead) {
    if (err) {
      return handleError(res, err);
    }
    if (!lead) {
      return res.send(404);
    }
    lead.set(req.body);
    //var updated = _.merge(lead, req.body);
    lead.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, lead);
    });
  });
};

exports.finish = function(req, res, next) {
  if (req.body._id) {
    delete req.body._id;
  }
  Lead.findById(req.params.id, function (err, lead) {
    if (err) {
      return handleError(res, err);
    }
    if (!lead) {
      return res.send(404);
    }
    lead.set(req.body);
    lead.set('completed', true);
    //var updated = _.merge(lead, req.body);
    lead.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return next();
    });
  });
}

// Deletes a lead from the DB.
exports.destroy = function (req, res) {
  Lead.findById(req.params.id, function (err, lead) {
    if (err) {
      return handleError(res, err);
    }
    if (!lead) {
      return res.send(404);
    }
    lead.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

/**
 *
 * @param req
 * @param res
 */
exports.getLeadsPerQuiz = function (req, res) {
  Lead.find({
    quiz: req.params.id
  }).sort('-created').populate({
    path: 'fields.field',
    match: {name: 'email'},
    select: 'name'
  }).populate({
    path: 'path.question'
  }).select('-esps').exec(function(err, leads) {
    if (err) return handleError(res, err);
    _.map(leads, function (lead) {
      lead.set('email', '', {strict: false});
      _.forEach(lead.fields, function (field) {
        if (field.field && field.field.name == 'email') {
          lead.set('email', field.value, {strict: false});
        }
      });
      return lead;
    });
    return res.json(200, leads);
  });
}

function handleError(res, err) {
  return res.send(500, err);
}
