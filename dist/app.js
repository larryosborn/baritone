var baritone, chalk, events, express, fs, handleImportException, http, instance, main, path, proto, _;

http = require('http');

chalk = require('chalk');

fs = require('fs');

path = require('path');

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
          handleImportException(moduleId + '/config', e);
        }
        try {
          return _this.importMiddleware(main.require(moduleId + '/middleware'));
        } catch (_error) {
          e = _error;
          return handleImportException(moduleId + '/middleware', e);
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
    var index;
    if (req.xhr || req.query && req.query.callback) {
      res.jsonp({
        view: view,
        data: res.locals
      });
    } else if (this.get('view engine')) {
      res.render('index', res.locals);
    } else {
      index = path.join(this.get('html'), 'index.html');
      fs.readFile(index, 'utf8', function(err, html) {
        if (err) {
          return res.sendStatus(500);
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
        }
        return console.log(chalk.green('Server running at') + ' ' + chalk.green.underline(url));
      };
    })(this));
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
