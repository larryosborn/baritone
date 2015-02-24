chai = require 'chai'
chaiHttp = require 'chai-http'
express = require 'express'
baritone = require './app'

chai.use chaiHttp
expect = chai.expect #http://chaijs.com/api/bdd/

app = baritone.app()
app.import '.'

describe 'baritone', ->
    it 'is instance of express', (done) ->
        expect(app.use).to.be.a 'function'
        expect(app.handle).to.be.a 'function'
        done()

    it 'has imported a config', (done) ->
        expect(app.get 'base_path').to.be.a 'string'
        expect(app.get 'port').to.exist
        expect(app.get 'host').to.be.a 'string'
        expect(app.get 'env').to.be.a 'string'
        done()

    it 'retrieves config via api', (done) ->
        chai.request app
            .get '/api/config'
            .end (err, res) ->
                expect(err).to.not.be.ok
                expect(res).to.have.status '200'
                expect(res).to.be.json
                expect(res.body.port).to.equal app.get 'port'
                expect(res.body.host).to.equal app.get 'host'
                expect(res.body.env).to.equal app.get 'env'
                expect(res.body.hidden).to.be.undefined
                expect(res.body.secret).to.be.undefined
                done()

    it 'serves static files from dist', (done) ->
        chai.request app
            .get '/static/js/client/sample.js'
            .end (err, res) ->
                expect(err).to.not.be.ok
                expect(res).to.have.status '200'
                expect(res).to.have.header 'content-type', 'application/javascript'
                done()

