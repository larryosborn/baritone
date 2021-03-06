const http = require('http')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const express = require('express')
const _ = require('lodash')
const events = require('events')
const https = require('https')
const mustache = require('mustache')
const socketio = require('socket.io')

let b = null
let main = null

const baritone = () => {
    if (b) {
        return b
    }
    b = Object.assign(express(), proto)
    main = module.parent || require.main
    const mainPath = path.resolve(path.dirname, main.filename)
    b.set('cwd', mainPath)
    let packageFile = path.join(mainPath, 'package.json')
    while (!fs.existsSync(packageFile)) {
        packageFile = path.resolve(path.dirname(packageFile), '..', 'package.json')
    }
    b.set('base_path', path.dirname(packageFile))
    b.events = new events.EventEmitter()
    return b
}

baritone.app = baritone

const proto = {
    baritone: true,

    app: baritone.app,

    express: express,

    resolveSetting(key, value) {
        if (typeof key === 'object') {
            return b.setMap(key)
        }
        let setting = process.env[key.toUpperCase()]
        if (setting != null) {
            if (!isNaN(setting)) {
                setting = Number(setting)
            }
            else if (setting.toLowerCase() === 'true') {
                setting = true
            }
            else if (setting.toLowerCase() === 'false') {
                setting = false
            }
            else if (setting.startsWith('{') || setting.startsWith('[')) {
                try {
                    setting = JSON.parse(setting)
                }
                catch (e) {
                    console.error(e)
                }
            }
        }
        else {
            setting = value
        }
        return setting
    },

    setMap(map) {
        Object.entries(map).forEach(([key, value]) => {
            const setting = b.resolveSetting(key, value)
            express.application.set.call(b, key, setting)
        })
        return b
    },

    import(...args) {
        b.imports = args
        b.importConfig()
        return b
    },

    importConfig() {
        b.imports.forEach((moduleId) => {
            try {
                const config = main.require(`${moduleId}/config`)
                b.setMap(_.omit(config, 'after'))
                if (typeof config.after === 'function') {
                    const mappedConfig = config.after(b)
                    if (typeof mappedConfig === 'object') {
                        b.setMap(mappedConfig)
                    }
                }
            }
            catch (e) {
                handleImportException(`${moduleId}/config`, e)
            }
        })
        return b
    },

    importMiddleware() {
        b.imports.forEach((moduleId) => {
            try {
                const middleware = main.require(`${moduleId}/middleware`)
                if (!middleware.baritone) {
                    b.use(middleware)
                }
            }
            catch (e) {
                handleImportException(`${moduleId}/middleware`, e)
            }
        })
        return b
    },

    importRoutes() {
        b.imports.forEach((moduleId) => {
            try {
                const routes = main.require(`${moduleId}/routes`)
                if (!routes.baritone) {
                    b.use(routes)
                }
            }
            catch (e) {
                handleImportException(`${moduleId}/routes`, e)
            }
        })
        return b
    },

    importSockets() {
        if (!b.get('io')) {
            b.set('io', new socketio())
        }
        b.imports.forEach((moduleId) => {
            try {
                const sockets = main.require(`${moduleId}/sockets`)
                if (!sockets.baritone) {
                    b.use(sockets)
                }
            }
            catch (e) {
                handleImportException(`${moduleId}/sockets`, e)
            }
        })
        return b
    },

    pjax(req, res, view) {
        const data = {
            view: view,
            data: res.locals,
        }
        if (req.xhr || req.query && req.query.callback) {
            res.jsonp(data)
        }
        else if (b.get('view engine')) {
            res.render((view || 'index'), res.locals)
        }
        else {
            try {
                const html = b.parseIndexHtml(data)
                return res.send(html)
            }
            catch (e) {
                return res.sendStatus(500)
            }
        }
        return b
    },

    parseIndexHtml(data) {
        let indexHtml = b.get('indexHtml')
        const index = path.join(b.get('html'), 'index.html')
        if (!indexHtml) {
            indexHtml = fs.readFileSync(index, 'utf8')
            b.set('indexHtml', indexHtml)
        }
        const options = {
            package: b.get('package'),
            build: b.get('build'),
            cacheBust: Date.now(),
            json: JSON.stringify(JSON.stringify(data)),
        }
        return mustache.render(indexHtml, options)
    },

    start() {
        b.importMiddleware()
        b.importRoutes()
        b.importSockets()
        const use_ssl = b.get('use_ssl')
        const protocol = use_ssl ? 'https://' : 'http://'
        const port = b.get('port')
        const host = b.get('host')
        let server
        const callback = () => {
            const env = b.get('env')
            const url = [protocol, server.address().address, ':', server.address().port, '/'].join('')
            chalk.enabled = env === 'development'
            console.log(`${chalk.green('Server running at')} ${chalk.green.underline(url)}`)
        }
        if (use_ssl) {
            const force_ssl = b.get('force_ssl')
            const ssl_key_path = b.get('ssl_key_path')
            const ssl_cert_path = b.get('ssl_cert_path')
            const base_path = b.get('base_path')
            const options = {
                key: fs.readFileSync(path.join(base_path, ssl_key_path || ssl_cert_path)),
                cert: fs.readFileSync(path.join(base_path, ssl_cert_path)),
            }
            server = https.createServer(options, b).listen(port, host, callback)
            if (force_ssl === true) {
                const httpServer = http.createServer((req, res) => {
                    res.writeHead(301, {
                        Location: protocol + req.headers.host + req.url,
                    })
                    res.end()
                })
                httpServer.listen(80, host, () => {
                    console.log(`${chalk.green('Server running at')} ${chalk.green.underline(`http://${host}:80/`)}`)
                })
            }
        }
        else {
            server = b.listen(port, host, callback)
        }
        if (b.get('use_socketio')) {
            b.get('io').listen(server)
        }
        return server
    },
}

const handleImportException = (moduleId, e) => {
    if (e.code === 'MODULE_NOT_FOUND') {
        const errorMessage = e.message
        const missingModuleId = errorMessage.match(/'([^']+)'/)
        if (missingModuleId && missingModuleId[1] && missingModuleId[1] !== moduleId) {
            throw e
        }
    }
    else {
        throw e
    }
}

if (require.main === module) {
    module.exports = baritone()
    module.exports.import('.').start()
}
else {
    module.exports = baritone
}
