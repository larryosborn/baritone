var app, baritone, bodyParser, compression, distPath, methodOverride, morgan, path, serveStatic;

serveStatic = require('serve-static');

path = require('path');

compression = require('compression');

bodyParser = require('body-parser');

methodOverride = require('method-override');

morgan = require('morgan');

baritone = require('./app');

app = baritone.app();

distPath = app.get('dist_path');

app.use(morgan(app.get('env') === 'production' ? 'combined' : 'dev'));

app.use(compression());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(methodOverride());

app.use('/static/js', serveStatic(path.join(distPath, 'js', 'client')));

app.use('/static', serveStatic(path.join(distPath)));

module.exports = app;
