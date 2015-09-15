/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/user/user.model');
var Market = require('../api/market/market.model');
var Esp = require('../api/esp/esp.model');
var Field = require('../api/field/field.model');

User.find({}).remove(function () {
  User.create({
      provider: 'local',
      name: 'Test User',
      email: 'test@test.com',
      password: 'test'
    }, {
      provider: 'local',
      role: 'admin',
      name: 'Admin',
      email: 'admin@admin.com',
      password: 'admin'
    }, function () {
      console.log('finished populating users');
    }
  );
});

Market.find({}).remove(function () {
  Market.create({
      name: 'Niche'
    }, function () {
      console.log('finished populating markets');
    }
  );
});

Esp.find({}).remove(function () {
  Esp.create({
      name: 'Aweber',
      logo: 'https://s3.amazonaws.com/quiz-app-nik/upload/aweber.png',
      active: true
    },{
      name: 'EmailDirect',
      logo: 'https://s3.amazonaws.com/quiz-app-nik/upload/emaildirect.png',
      active: true
    },{
      name: 'MailChimp',
      logo: 'https://s3.amazonaws.com/quiz-app-nik/upload/mailchimp.png',
      active: true
    },{
      name: 'InfusionSoft',
      logo: 'https://s3.amazonaws.com/quiz-app-nik/upload/infusionsoft.png',
      active: false
    }, function () {
      console.log('finished populating email service providers');
    }
  );
});

Field.find({}).remove(function () {
  Field.create({
      name: 'first_name',
      label: 'First Name',
      type: 'text',
      category: 'system',
      required: true
    },{
      name: 'last_name',
      label: 'Last Name',
      type: 'text',
      category: 'system',
      required: true
    },{
      name: 'email',
      label: 'E-mail',
      type: 'email',
      required: true,
      category: 'system'
    }, function () {
      console.log('finished populating system fields');
    }
  );
});
