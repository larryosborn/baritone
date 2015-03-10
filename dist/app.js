var baritone, chalk, events, express, fs, http, instance, main, notifier, path, proto, _;

http = require('http');

chalk = require('chalk');

fs = require('fs');

path = require('path');

notifier = require('node-notifier');

express = require('express');

_ = require('underscore');

events = require('events');

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
        var e;
        if (moduleId.indexOf('.') !== 0) {
          moduleId += '/dist';
        }
        try {
          _this.importConfig(main.require(moduleId + '/config'));
        } catch (_error) {
          e = _error;
          if (e.code !== 'MODULE_NOT_FOUND') {
            throw e;
          }
        }
        try {
          return _this.importMiddleware(main.require(moduleId + '/middleware'));
        } catch (_error) {
          e = _error;
          if (e.code !== 'MODULE_NOT_FOUND') {
            throw e;
          }
        }
      };
    })(this));
    stack.forEach((function(_this) {
      return function(moduleId) {
        var e;
        if (moduleId.indexOf('.') !== 0) {
          moduleId += '/dist';
        }
        try {
          return _this.importRoutes(main.require(moduleId + '/routes'));
        } catch (_error) {
          e = _error;
          if (e.code !== 'MODULE_NOT_FOUND') {
            throw e;
          }
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
  render: function(req, res, view) {
    var data;
    if (req.xhr) {
      data = _.extend({}, res.locals);
      res.jsonp({
        view: view,
        data: data
      });
    } else {
      fs.readFile(this.get('html'), 'utf8', function(err, html) {
        if (err) {
          return res.send(500);
        }
        return res.send(html);
      });
    }
    return this;
  },
  start: function() {
    var server;
    server = this.listen(this.get('port'), this.get('host'), (function(_this) {
      return function() {
        var url;
        url = ['http://', server.address().address, ':', server.address().port, '/'].join('');
        if (_this.get('node_env') === 'development') {
          chalk.enabled = true;
          notifier.notify({
            title: _this.get('package').name,
            message: 'Server running at ' + url
          }, function(err, response) {
            return console.error(err);
          });
        }
        return console.log(chalk.green('Server running at') + ' ' + chalk.green.underline(url));
      };
    })(this));
    return server;
  }
};

if (require.main === module) {
  module.exports = baritone();
  module.exports["import"]('.').start();
}
