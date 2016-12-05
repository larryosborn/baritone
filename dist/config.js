var _, app, baritone, basePath, buildFile, config, fs, packageFile, path;

path = require('path');

fs = require('fs');

_ = require('underscore');

baritone = require('./app');

app = baritone.app();

basePath = app.get('base_path');

config = {
  dist_path: path.join(basePath, 'dist'),
  html: path.join(basePath, 'dist', 'html'),
  views: path.join(basePath, 'dist', 'html'),
  port: 3000,
  host: '0.0.0.0',
  secret: 'change me',
  hidden: ['secret'],
  max_age: 1000 * 60 * 60 * 24 * 365
};

try {
  buildFile = path.join(basePath, 'build.json');
  config.build = require(buildFile);
} catch (error) {}

try {
  packageFile = path.join(basePath, 'package.json');
  config["package"] = require(packageFile);
} catch (error) {}

module.exports = config;
