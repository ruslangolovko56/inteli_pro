# Quiz App

## Requirements

First, you need to have Node.js installed on your system. Please visit [http://nodejs.org](http://nodejs.org) for more information.

### Bower

`npm install -g bower`

### Grunt

`npm install -g grunt-cli`

### Installation

`bower install`

This will download necessary assets files.

`npm install`

This will install necessary Node.js packages (including Express web server).

## Preview

To preview the app from browser, we need to run:

`grunt serve`

And the app is ready at [http://localhost:9000/](http://localhost:9000/)

## Seeds Data

To insert seeds data, open `server/config/environment/development.js` and change `seedDB` value to `true`. Refresh the page once and revert the value of `seedDB` back to `false`. New seed data will be added.

- email: admin@admin.com
- password: admin

## Building

To create a distribution file for this app, run:
`grunt build`
A new directory named `dist` containing build package is created.
