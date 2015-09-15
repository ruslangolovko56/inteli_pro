'use strict';

var _ = require('lodash');
var Field = require('./field.model');
var config = require('../../config/environment');
var async = require('async');

// Get list of fields
exports.index = function (req, res) {
  var userId = req.user._id;
  Field.find({ active: true }).or([{category: 'system'}, {user: userId}]).exec(function (err, fields) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(200, fields);
  });
};

exports.queryAll = function (req, res) {
  var userId= req.user._id;
  Field.find({ active: true, user: userId}).exec(function (err, fields) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(200, fields);
  });
}

// Get list of fields for form fields
exports.queryForm = function (req, res) {
  var userId = req.user._id;
  Field.find({
    active: true,
    category: {$ne: 'answer'}
  }).or([{category: 'system'}, {user: userId}]).exec(function (err, fields) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(200, fields);
  });
};

// Get a single field
exports.show = function (req, res) {
  Field.findById(req.params.id, function (err, field) {
    if (err) {
      return handleError(res, err);
    }
    if (!field) {
      return res.send(404);
    }

    // send field
    prepareSubmit(field, function(err, field) {
      if(err) {
        return handleError(res, err);
      }
      return res.json(field);
    });
  });
};

// Creates a new field in the DB.
exports.create = function (req, res) {
  var userId = req.user._id;
  req.body.user = userId;
  //if(req.user.role === 'admin') {
  //  req.body.category = 'system';
  //} else {
  //  req.body.category = 'custom';
  //}
  Field.create(req.body, function (err, field) {
    if (err) {
      return handleError(res, err);
    }
    if (!field) {
      return res.send(404);
    }

    // send back saved field
    prepareSubmit(field, function(err, field) {
      if(err) {
        return handleError(res, err);
      }
      return res.json(201, field);
    });
  });
};

// Updates an existing field in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Field.findById(req.params.id, function (err, field) {
    if (err) {
      return handleError(res, err);
    }
    if (!field) {
      return res.send(404);
    }
    //var updated = _.merge(field, req.body);
    field.set(req.body);
    field.save(function (err, field) {
      if (err) {
        return handleError(res, err);
      }

      // send back updated field
      prepareSubmit(field, function(err, field) {
        if(err) {
          return handleError(res, err);
        }
        return res.json(200, field);
      });
    });
  });
};

// Deletes a field from the DB.
exports.destroy = function (req, res) {
  var userId = req.user._id;
  Field.findOne({_id: req.params.id, user: userId}, function (err, field) {
    if (err) {
      return handleError(res, err);
    }
    if (!field) {
      return res.send(404);
    }
    field.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

// Get custom fields
exports.customFields = function (req, res) {
  var userId = req.user._id;
  Field.find({user: userId, category: 'custom'}, function (err, fields) {
    if (err) {
      return handleError(res, err);
    }
    if (fields.length == 0) {
      return res.json(200, fields);
    }
    async.map(fields, function (field, cb) {
      prepareSubmit(field, function(err, field) {
        if(err) {
          return cb(err);
        }
        return cb(null, field);
      });
    }, function(err, fields) {
      if(err) {
        return handleError(res, err);
      }
      return res.json(200, fields);
    });
  });
};

// Get system fields
exports.systemFields = function (req, res) {
  Field.find({category: 'system'}, function (err, fields) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(200, fields);
  });
};

// Get form fields
exports.formFields = function (req, res) {
  var userId = req.user._id;

  Field.find({user: userId, category: 'form'}, function (err, fields) {
    if (err) {
      return handleError(res, err);
    }

    if (fields.length == 0) {
      return res.json(200, fields);
    }


    async.map(fields, function (field, cb) {
      prepareSubmit(field, function(err, field) {
        if(err) {
          return cb(err);
        }
        return cb(null, field);
      });
    }, function(err, fields) {
      if(err) {
        return handleError(res, err);
      }
      return res.json(200, fields);
    });
  });
};

// Get answer feilds
exports.answerFields = function (req, res) {
  var userId = req.user._id;
  Field.find({user: userId, category: 'answer'}, function (err, fields) {
    if (err) {
      return handleError(res, err);
    }
    if (fields.length == 0) {
      return res.json(200, fields);
    }
    async.map(fields, function (field, cb) {
      prepareSubmit(field, function(err, field) {
        if(err) {
          return cb(err);
        }
        return cb(null, field);
      });
    }, function(err, fields) {
      if(err) {
        return handleError(res, err);
      }
      return res.json(200, fields);
    });
  });
};

// Get fields from param
exports.queryByParams = function(req, res) {
  var userId = req.body.userId;
  var query = {};

  query.user = userId;

  var keys = [];
  for(var key in req.body.params) {
    keys.push(key);
  }

  query.param = {
    $in: keys
  };

  Field.find(query, function(err, fields) {
    if(err) {
      return handleError(res, err);
    }

    return res.json(fields);
  });
};

// Attach editable and removable before send back
function prepareSubmit(field, cb) {
  async.parallel([
    function(callback){
      field.isPublished().then(function(isPublished) {
        field.set('editable', !isPublished, {strict: false});
        callback();
      }, function(err) {
        callback(err);
      });
    },
    function(callback){
      field.canDelete().then(function(canDelete) {
        field.set('removable', canDelete, {strict: false});
        callback();
      }, function(err) {
        callback(err);
      });
    }
  ], function(err) {
    if(err) {
      return cb(err);
    }
    return cb(null, field);
  });
}


function handleError(res, err) {
  return res.send(500, err);
}
