const path = require('path')
const compression = require('compression')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const morgan = require('morgan')
const baritone = require('./index')
const express = require('express')

const app = baritone.app()
const distPath = app.get('dist_path')
const env = app.get('env')

if (env !== 'test') {
    app.use(morgan(env === 'production' ? 'combined' : 'dev'))
}
app.use(compression())
app.use(bodyParser.json({
    limit: '50mb',
}))
app.use(bodyParser.urlencoded({
    extended: true,
}))
app.use(methodOverride())

app.use('/static', express.static(distPath, {
    maxAge: app.get('max_age'),
}))

module.exports = app
