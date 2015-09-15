'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip: process.env.OPENSHIFT_NODEJS_IP ||
  process.env.IP ||
  undefined,

  // Server port
  port: process.env.OPENSHIFT_NODEJS_PORT ||
  process.env.PORT ||
  8080,

  // MongoDB connection options
  mongo: {
    uri: process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME ||
    'mongodb://localhost/quizapp'
  },

  // Rabbitmq connection option
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || 'amqp://54.86.58.63',
    server: {
      url: process.env.RABBITMQ_SERVER_URL || 'http://54.86.58.63:3000'
    }
  },

  seedDB: false,

  domain: 'http://52.0.250.174:8080'
};
