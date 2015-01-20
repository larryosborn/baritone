path = require 'path'
fs = require 'fs'
_ = require 'underscore'
baritone = require './app'

app = baritone.app()
basePath = app.get 'base_path'

# default config
defaults =
    dist_path: path.join basePath, 'dist'
    html: path.join basePath, 'dist', 'html', 'index.html'
    port: 3000
    host: '0.0.0.0'
    secret: 'change me'
    hidden: ['secret']

# env config
env = {}
Object.keys(process.env).forEach (envVar) ->
    env[envVar.toLowerCase()] = process.env[envVar] if defaults[envVar.toLowerCase()]

# merge env into defaults to create config
config = _.extend {}, defaults, env

# package.json
config.package = require path.join basePath, 'package.json'

module.exports = config
