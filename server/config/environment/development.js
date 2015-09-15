'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/quizapp'
  },

  rabbitmq: {
    uri: 'amqp://54.86.58.63',
    server: {
      url: 'http://54.86.58.63:3000'
    }
  },

  seedDB: false,

  domain: 'http://localhost:9000'
};
