http = require 'http'
chalk = require 'chalk'
fs = require 'fs'
path = require 'path'
express = require 'express'
_ = require 'underscore'
events = require 'events'
https = require 'https'
mustache = require 'mustache'

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

    import: ->
        instance.imports = [].slice.apply arguments
        @importConfig()
        return this

    importConfig: ->
        instance.imports.forEach (moduleId) =>
            if moduleId.indexOf('.') isnt 0
                moduleId += '/dist'
            try
                config = main.require moduleId + '/config'
                if typeof config is 'object'
                    env = process.env
                    Object.keys(config).forEach (option) =>
                        if typeof env[option.toUpperCase()] isnt 'undefined'
                            setting = env[option.toUpperCase()]
                            if not isNaN Number setting
                                setting = Number setting
                            else if setting.toLowerCase() is 'true'
                                setting = true
                            else if setting.toLowerCase() is 'false'
                                setting = false
                            else if setting[0] is '{' or setting[0] is '['
                                try setting = JSON.parse setting
                        else
                            setting = config[option]
                        @set option, setting
            catch e
                handleImportException moduleId + '/config', e
        return this

    importMiddleware: ->
        instance.imports.forEach (moduleId) =>
            if moduleId.indexOf('.') isnt 0
                moduleId += '/dist'
            try
                middleware = main.require moduleId + '/middleware'
                if not middleware.baritone
                    @use middleware
            catch e
                handleImportException moduleId + '/middleware', e
        return this

    importRoutes: ->
        instance.imports.forEach (moduleId) =>
            if moduleId.indexOf('.') isnt 0
                moduleId += '/dist'
            try
                routes = main.require moduleId + '/routes'
                if not routes.baritone
                    @use routes
            catch e
                handleImportException moduleId + '/routes', e
        return this

    pjax: (req, res, view) ->
        if req.xhr or req.query and req.query.callback
            res.jsonp
                view: view
                data: res.locals
        else if @get 'view engine'
            res.render (view or 'index'), res.locals
        else
            @parseIndexHtml (err, html) ->
                if err
                    return res.sendStatus 500
                res.send html
        return this

    parseIndexHtml: (callback) ->
        indexHtml = @get 'indexHtml'
        return callback(null, indexHtml) if indexHtml
        index = path.join @get('html'), 'index.html'
        fs.readFile index, 'utf8', (err, html) =>
            return callback(err) if err
            indexHtml = mustache.render html, { package: @get('package'), cacheBust: Date.now() }
            @set 'indexHtml', indexHtml
            return callback null, indexHtml

    start: ->
        @importMiddleware()
        @importRoutes()
        use_ssl = @get 'use_ssl'
        force_ssl = @get 'force_ssl'
        base_path = @get 'base_path'
        ssl_key_path = @get 'ssl_key_path'
        ssl_cert_path = @get 'ssl_cert_path'
        protocol = if use_ssl then 'https://' else 'http://'
        callback = =>
            url = [protocol, server.address().address, ':', server.address().port, '/'].join('')
            chalk.enabled = true if @get('node_env') is 'development'
            console.log chalk.green('Server running at') + ' ' + chalk.green.underline url
        if use_ssl
            options =
                key: fs.readFileSync path.join base_path, ssl_key_path or ssl_cert_path
                cert: fs.readFileSync path.join base_path, ssl_cert_path
            server = https.createServer(options, this).listen @get('port'), @get('host'), callback
            if force_ssl is true
                httpServer = http.createServer (req, res) ->
                    res.writeHead 301, Location: protocol + req.headers.host + req.url
                    res.end()
                httpServer.listen 80, @get('host'), =>
                    console.log chalk.green('Server running at') + ' ' + chalk.green.underline 'http://' + @get('host') + ':80/'
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
    module.exports.import('.').start()
