path = require 'path'
fs = require 'fs'
_ = require 'underscore'
baritone = require './app'

app = baritone.app()
basePath = app.get 'base_path'

# default config
config =
    dist_path: path.join basePath, 'dist'
    html: path.join basePath, 'dist', 'html', 'index.html'
    port: 3000
    host: '0.0.0.0'
    secret: 'change me'
    hidden: ['secret']

# package.json
config.package = require path.join basePath, 'package.json'

module.exports = config
