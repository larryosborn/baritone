var _, baritone, chalk, events, express, fs, handleImportException, http, https, instance, main, mustache, path, proto;

http = require('http');

chalk = require('chalk');

fs = require('fs');

path = require('path');

express = require('express');

_ = require('underscore');

events = require('events');

https = require('https');

mustache = require('mustache');

instance = null;

main = null;

module.exports = baritone = function() {
  var app, mainPath, packageFile;
  app = _.extend(express(), proto);
  app.express = express;
  main = module.parent || require.main;
  mainPath = path.resolve(path.dirname(main.filename));
  app.set('cwd', mainPath);
  packageFile = path.join(mainPath, 'package.json');
  while (!fs.existsSync(packageFile)) {
    packageFile = path.resolve(path.dirname(packageFile), '..', 'package.json');
  }
  app.set('base_path', path.dirname(packageFile));
  app.events = new events.EventEmitter();
  return instance = app;
};

baritone.app = function() {
  if (instance) {
    return instance;
  } else {
    return baritone();
  }
};

proto = {
  baritone: true,
  app: baritone.app,
  "import": function() {
    instance.imports = [].slice.apply(arguments);
    this.importConfig();
    return this;
  },
  importConfig: function() {
    instance.imports.forEach((function(_this) {
      return function(moduleId) {
        var config, e, env, error;
        if (moduleId.indexOf('.') !== 0) {
          moduleId += '/dist';
        }
        try {
          config = main.require(moduleId + '/config');
          if (typeof config === 'object') {
            env = process.env;
            return Object.keys(config).forEach(function(option) {
              var setting;
              if (typeof env[option.toUpperCase()] !== 'undefined') {
                setting = env[option.toUpperCase()];
                if (!isNaN(Number(setting))) {
                  setting = Number(setting);
                } else if (setting.toLowerCase() === 'true') {
                  setting = true;
                } else if (setting.toLowerCase() === 'false') {
                  setting = false;
                } else if (setting[0] === '{' || setting[0] === '[') {
                  try {
                    setting = JSON.parse(setting);
                  } catch (undefined) {}
                }
              } else {
                setting = config[option];
              }
              return _this.set(option, setting);
            });
          }
        } catch (error) {
          e = error;
          return handleImportException(moduleId + '/config', e);
        }
      };
    })(this));
    return this;
  },
  importMiddleware: function() {
    instance.imports.forEach((function(_this) {
      return function(moduleId) {
        var e, error, middleware;
        if (moduleId.indexOf('.') !== 0) {
          moduleId += '/dist';
        }
        try {
          middleware = main.require(moduleId + '/middleware');
          if (!middleware.baritone) {
            return _this.use(middleware);
          }
        } catch (error) {
          e = error;
          return handleImportException(moduleId + '/middleware', e);
        }
      };
    })(this));
    return this;
  },
  importRoutes: function() {
    instance.imports.forEach((function(_this) {
      return function(moduleId) {
        var e, error, routes;
        if (moduleId.indexOf('.') !== 0) {
          moduleId += '/dist';
        }
        try {
          routes = main.require(moduleId + '/routes');
          if (!routes.baritone) {
            return _this.use(routes);
          }
        } catch (error) {
          e = error;
          return handleImportException(moduleId + '/routes', e);
        }
      };
    })(this));
    return this;
  },
  pjax: function(req, res, view) {
    if (req.xhr || req.query && req.query.callback) {
      res.jsonp({
        view: view,
        data: res.locals
      });
    } else if (this.get('view engine')) {
      res.render(view || 'index', res.locals);
    } else {
      this.parseIndexHtml(function(err, html) {
        if (err) {
          return res.sendStatus(500);
        }
        return res.send(html);
      });
    }
    return this;
  },
  parseIndexHtml: function(callback) {
    var index, indexHtml;
    indexHtml = this.get('indexHtml');
    if (indexHtml) {
      return callback(null, indexHtml);
    }
    index = path.join(this.get('html'), 'index.html');
    return fs.readFile(index, 'utf8', (function(_this) {
      return function(err, html) {
        if (err) {
          return callback(err);
        }
        indexHtml = mustache.render(html, {
          "package": _this.get('package'),
          cacheBust: Date.now()
        });
        _this.set('indexHtml', indexHtml);
        return callback(null, indexHtml);
      };
    })(this));
  },
  start: function() {
    var base_path, callback, force_ssl, httpServer, options, protocol, server, ssl_cert_path, ssl_key_path, use_ssl;
    this.importMiddleware();
    this.importRoutes();
    use_ssl = this.get('use_ssl');
    force_ssl = this.get('force_ssl');
    base_path = this.get('base_path');
    ssl_key_path = this.get('ssl_key_path');
    ssl_cert_path = this.get('ssl_cert_path');
    protocol = use_ssl ? 'https://' : 'http://';
    callback = (function(_this) {
      return function() {
        var url;
        url = [protocol, server.address().address, ':', server.address().port, '/'].join('');
        if (_this.get('node_env') === 'development') {
          chalk.enabled = true;
        }
        return console.log(chalk.green('Server running at') + ' ' + chalk.green.underline(url));
      };
    })(this);
    if (use_ssl) {
      options = {
        key: fs.readFileSync(path.join(base_path, ssl_key_path || ssl_cert_path)),
        cert: fs.readFileSync(path.join(base_path, ssl_cert_path))
      };
      server = https.createServer(options, this).listen(this.get('port'), this.get('host'), callback);
      if (force_ssl === true) {
        httpServer = http.createServer(function(req, res) {
          res.writeHead(301, {
            Location: protocol + req.headers.host + req.url
          });
          return res.end();
        });
        httpServer.listen(80, this.get('host'), (function(_this) {
          return function() {
            return console.log(chalk.green('Server running at') + ' ' + chalk.green.underline('http://' + _this.get('host') + ':80/'));
          };
        })(this));
      }
    } else {
      server = this.listen(this.get('port'), this.get('host'), callback);
    }
    return server;
  }
};

handleImportException = function(moduleId, e) {
  var errorMessage, missingModuleId;
  if (e.code === 'MODULE_NOT_FOUND') {
    errorMessage = e.message;
    missingModuleId = errorMessage.match(/'([^']+)'/);
    if (missingModuleId && missingModuleId[1] && missingModuleId[1] !== moduleId) {
      throw e;
    }
  } else {
    throw e;
  }
};

if (require.main === module) {
  module.exports = baritone();
  module.exports["import"]('.').start();
}
