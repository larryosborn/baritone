baritone = require './app'
controllers = require './controllers'

app = baritone.app()

app.get '/api/config', controllers.config

module.exports = app
