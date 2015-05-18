path = require 'path'
fs = require 'fs'
_ = require 'underscore'
baritone = require './app'

app = baritone.app()
basePath = app.get 'base_path'

# default config
config =
    dist_path: path.join basePath, 'dist'
    html: path.join basePath, 'dist', 'html'
    views: path.join basePath, 'dist', 'html'
    port: 3000
    host: '0.0.0.0'
    secret: 'change me'
    hidden: ['secret']

# build.json for deployment time options
try
    buildFile = path.join basePath, 'build.json'
    config.build = require buildFile

# package.json
try
    packageFile = path.join basePath, 'package.json'
    config.package = require packageFile

module.exports = config
