var app, baritone, chai, chaiHttp, expect, express;

chai = require('chai');

chaiHttp = require('chai-http');

express = require('express');

baritone = require('./app');

chai.use(chaiHttp);

expect = chai.expect;

app = baritone.app();

app["import"]('.');

describe('baritone', function() {
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
      return done();
    });
  });
  return it('serves static files from dist', function(done) {
    return chai.request(app).get('/static/js/sample.js').end(function(err, res) {
      expect(err).to.not.be.ok;
      expect(res).to.have.status('200');
      expect(res).to.have.header('content-type', 'application/javascript');
      return done();
    });
  });
});
