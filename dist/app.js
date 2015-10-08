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
  "import": function(moduleIds) {
    var stack;
    stack = [].slice.apply(arguments);
    stack.forEach((function(_this) {
      return function(moduleId) {
        var e, error, error1;
        if (moduleId.indexOf('.') !== 0) {
          moduleId += '/dist';
        }
        try {
          _this.importConfig(main.require(moduleId + '/config'));
        } catch (error) {
          e = error;
          handleImportException(moduleId + '/config', e);
        }
        try {
          return _this.importMiddleware(main.require(moduleId + '/middleware'));
        } catch (error1) {
          e = error1;
          return handleImportException(moduleId + '/middleware', e);
        }
      };
    })(this));
    stack.forEach((function(_this) {
      return function(moduleId) {
        var e, error;
        if (moduleId.indexOf('.') !== 0) {
          moduleId += '/dist';
        }
        try {
          return _this.importRoutes(main.require(moduleId + '/routes'));
        } catch (error) {
          e = error;
          return handleImportException(moduleId + '/routes', e);
        }
      };
    })(this));
    return this;
  },
  importConfig: function(config) {
    var env;
    if (typeof config === 'object') {
      env = process.env;
      Object.keys(config).forEach((function(_this) {
        return function(option) {
          if (typeof env[option.toUpperCase()] !== 'undefined') {
            return _this.set(option, env[option.toUpperCase()]);
          } else {
            return _this.set(option, config[option]);
          }
        };
      })(this));
    }
    return this;
  },
  importMiddleware: function(middleware) {
    if (!middleware.baritone) {
      this.use(middleware);
    }
    return this;
  },
  importRoutes: function(routes) {
    if (!routes.baritone) {
      this.use(routes);
    }
    return this;
  },
  pjax: function(req, res, view) {
    if (req.xhr || req.query && req.query.callback) {
      res.jsonp({
        view: view,
        data: res.locals
      });
    } else if (this.get('view engine')) {
      res.render('index', res.locals);
    } else {
      this.parseIndexHtml(function(err, html) {
        if (err) {
          console.error(err);
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
          return callbackr(err);
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
  module.exports["import"]('.', './missing').start();
}
