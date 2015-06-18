path = require 'path'
compression = require 'compression'
bodyParser = require 'body-parser'
methodOverride = require 'method-override'
morgan = require 'morgan'
baritone = require './app'

app = baritone.app()
distPath = app.get 'dist_path'

app.use morgan(if app.get('env') is 'production' then 'combined' else 'dev')
app.use compression()
app.use bodyParser.json()
app.use bodyParser.urlencoded extended: true
app.use methodOverride()

app.use '/static', app.express.static distPath, maxAge: app.get 'max_age'

module.exports = app
