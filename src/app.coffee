http = require 'http'
chalk = require 'chalk'
fs = require 'fs'
path = require 'path'
notifier = require 'node-notifier'
express = require 'express'
_ = require 'underscore'

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
                throw e if e.code isnt 'MODULE_NOT_FOUND'
            try
                @importMiddleware main.require moduleId + '/middleware'
            catch e
                throw e if e.code isnt 'MODULE_NOT_FOUND'
        stack.forEach (moduleId) =>
            if moduleId.indexOf('.') isnt 0
                moduleId += '/dist'
            try
                @importRoutes main.require moduleId + '/routes'
            catch e
                throw e if e.code isnt 'MODULE_NOT_FOUND'
        return this

    importConfig: (config) ->
        if typeof config is 'object'
            Object.keys(config).forEach (option) =>
                if typeof @get(option) is 'undefined'
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

    render: (req, res, view) ->
        if req.xhr
            data = _.extend {}, res.locals
            res.jsonp
                view: view
                data: data
        else
            fs.readFile @get('html'), 'utf8', (err, html) ->
                if err
                    return res.send 500
                res.send html
        return this

    start: ->
        server = @listen @get('port'), @get('host'), =>
            url = ['http://', server.address().address, ':', server.address().port, '/'].join('')
            if @get('node_env') is 'development'
                chalk.enabled = true
                notifier.notify { title: @get('package').name, message: 'Server running at ' + url }, (err, response) -> console.error err
            console.log chalk.green('Server running at') + ' ' + chalk.green.underline url
        return server

if require.main is module
    module.exports = baritone()
    module.exports.import('.').start()
