http = require 'http'
chalk = require 'chalk'
fs = require 'fs'
path = require 'path'
express = require 'express'
_ = require 'underscore'
events = require 'events'
https = require 'https'

instance = null
main = null

module.exports = baritone = ->
    app = _.extend express(), proto
    app.express = express
    main = module.parent or require.main
    mainPath = path.resolve path.dirname main.filename
    app.set 'cwd', mainPath
    packageFile = path.join mainPath, 'package.json'
    while not fs.existsSync packageFile
        packageFile = path.resolve path.dirname(packageFile), '..', 'package.json'
    app.set 'base_path', path.dirname packageFile
    app.events = new events.EventEmitter()
    return instance = app

baritone.app = ->
    if instance
        return instance
    else
        return baritone()

proto =
    baritone: true

    app: baritone.app

    import: (moduleIds) ->
        stack = [].slice.apply arguments
        stack.forEach (moduleId) =>
            if moduleId.indexOf('.') isnt 0
                moduleId += '/dist'
            try
                @importConfig main.require moduleId + '/config'
            catch e
                handleImportException moduleId + '/config', e
            try
                @importMiddleware main.require moduleId + '/middleware'
            catch e
                handleImportException moduleId + '/middleware', e
        stack.forEach (moduleId) =>
            if moduleId.indexOf('.') isnt 0
                moduleId += '/dist'
            try
                @importRoutes main.require moduleId + '/routes'
            catch e
                handleImportException moduleId + '/routes', e
        return this

    importConfig: (config) ->
        if typeof config is 'object'
            env = process.env
            Object.keys(config).forEach (option) =>
                if typeof env[option.toUpperCase()] isnt 'undefined'
                    @set option, env[option.toUpperCase()]
                else
                    @set option, config[option]
        return this

    importMiddleware: (middleware) ->
        if not middleware.baritone
            @use middleware
        return this

    importRoutes: (routes) ->
        if not routes.baritone
            @use routes
        return this

    pjax: (req, res, view) ->
        if req.xhr or req.query and req.query.callback
            res.jsonp
                view: view
                data: res.locals
        else if @get 'view engine'
            res.render 'index', res.locals
        else
            index = path.join @get('html'), 'index.html'
            fs.readFile index, 'utf8', (err, html) ->
                if err
                    return res.sendStatus 500
                res.send html
        return this

    start: ->
        ssl = @get 'ssl'
        callback = =>
            protocol = if ssl then 'https://' else 'http://'
            url = [protocol, server.address().address, ':', server.address().port, '/'].join('')
            chalk.enabled = true if @get('node_env') is 'development'
            console.log chalk.green('Server running at') + ' ' + chalk.green.underline url
        if ssl is true
            options =
                key: fs.readFileSync path.join @get('base_path'), @get('ssl_key_path')
                cert: fs.readFileSync path.join @get('base_path'), @get('ssl_cert_path')
            server = https.createServer(options, this).listen @get('port'), @get('host'), callback
        else
            server = @listen @get('port'), @get('host'), callback
        return server

handleImportException = (moduleId, e) ->
    if e.code is 'MODULE_NOT_FOUND'
        errorMessage = e.message
        missingModuleId = errorMessage.match /'([^']+)'/
        if missingModuleId and missingModuleId[1] and missingModuleId[1] isnt moduleId
            throw e
    else
        throw e

if require.main is module
    module.exports = baritone()
    module.exports.import('.', './missing').start()
