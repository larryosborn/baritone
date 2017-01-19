const baritone = require('./index');
const controllers = require('./controllers');

const app = baritone.app();

app.get('/__config', controllers.config);

module.exports = app;
