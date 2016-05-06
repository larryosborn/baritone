var app, baritone, controllers;

baritone = require('./app');

controllers = require('./controllers');

app = baritone.app();

module.exports = app;
