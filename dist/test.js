var app, baritone, chai, chaiHttp, expect, express, fs;

chai = require('chai');

chaiHttp = require('chai-http');

express = require('express');

baritone = require('./app');

fs = require('fs');

chai.use(chaiHttp);

expect = chai.expect;

app = baritone.app();

app["import"]('.');

app.get('/', function(req, res) {
  res.locals.test = 'pass';
  return app.pjax(req, res, 'index');
});

it('is instance of express', function(done) {
  expect(app.use).to.be.a('function');
  expect(app.handle).to.be.a('function');
  return done();
});

it('has imported a config', function(done) {
  expect(app.get('base_path')).to.be.a('string');
  expect(app.get('port')).to.exist;
  expect(app.get('host')).to.be.a('string');
  expect(app.get('env')).to.be.a('string');
  return done();
});

it('retrieves config via api', function(done) {
  return chai.request(app).get('/api/config').end(function(err, res) {
    expect(err).to.not.be.ok;
    expect(res).to.have.status('200');
    expect(res).to.be.json;
    expect(res.body.port).to.equal(app.get('port'));
    expect(res.body.host).to.equal(app.get('host'));
    expect(res.body.env).to.equal(app.get('env'));
    expect(res.body.hidden).to.be.undefined;
    expect(res.body.secret).to.be.undefined;
    expect(res.body.build).to.have.property('tag');
    expect(res.body["package"]).to.have.property('name');
    return done();
  });
});

it('serves static files from dist', function(done) {
  return chai.request(app).get('/static/js/client/sample.js').end(function(err, res) {
    expect(err).to.not.be.ok;
    expect(res).to.have.status('200');
    expect(res).to.have.header('content-type', 'application/javascript');
    return done();
  });
});

it('serves html', function(done) {
  return chai.request(app).get('/').end(function(err, res) {
    expect(err).to.not.be.ok;
    expect(res).to.have.status('200');
    expect(res).to.be.html;
    expect(res.text).to.equal('\n');
    return done();
  });
});

it('serves templates', function(done) {
  app.engine('html', function(filePath, options, callback) {
    return fs.readFile(filePath, function(err, content) {
      content = content.toString().replace(/\{\{([^}]+)\}\}/, function(m, p1) {
        return options[p1];
      });
      return callback(null, content);
    });
  });
  app.set('view engine', 'html');
  return chai.request(app).get('/').end(function(err, res) {
    expect(err).to.not.be.ok;
    expect(res).to.have.status('200');
    expect(res).to.be.html;
    expect(res.text).to.equal('pass\n');
    return done();
  });
});

it('correctly handles events', function(done) {
  var emitted;
  emitted = false;
  app.events.once('example', function(arg) {
    return emitted = arg;
  });
  app.events.emit('example', true);
  expect(emitted).to.be["true"];
  return done();
});
