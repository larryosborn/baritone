const chai = require('chai')
const chaiHttp = require('chai-http')
const express = require('express')
const baritone = require('./index')
const path = require('path')
const fs = require('fs')

chai.use(chaiHttp)
const expect = chai.expect //http://chaijs.com/api/bdd/

app = baritone.app()
app.import('.')
app.set('dist_path', path.join(app.get('base_path'), 'test_files'))
app.set('html', path.join(app.get('base_path'), 'test_files', 'html'))
app.set('views', path.join(app.get('base_path'), 'test_files', 'html'))
app.importMiddleware()
app.importRoutes()
app.get('/', (req, res) => {
    res.locals.test = 'pass'
    app.pjax(req, res, 'index')
})

it('is instance of express', (done) => {
    expect(app.use).to.be.a('function')
    expect(app.handle).to.be.a('function')
    done()
})

it('has imported a config', (done) => {
    expect(app.get('base_path')).to.be.a('string')
    expect(app.get('port')).to.exist
    expect(app.get('host')).to.be.a('string')
    expect(app.get('env')).to.be.a('string')
    expect(app.get('package')).to.have.property('name')
    done()
})

it('retrieves config via api', (done) => {
    chai.request(app)
        .get('/__config')
        .end((err, res) => {
            expect(err).to.not.be.ok
            expect(res).to.have.status('200')
            expect(res).to.be.json
            expect(res.body.port).to.equal(app.get('port'))
            expect(res.body.host).to.equal(app.get('host'))
            expect(res.body.env).to.equal(app.get('env'))
            expect(res.body.hidden).to.be.undefined
            expect(res.body.secret).to.be.undefined
            expect(res.body.build).to.have.property('tag')
            expect(res.body.package).to.have.property('name')
            done()
        })
})

it('serves static files from dist', (done) => {
    chai.request(app)
        .get('/static/js/sample.js')
        .end((err, res) => {
            expect(err).to.not.be.ok
            expect(res).to.have.status('200')
            expect(res).to.have.header('content-type', 'application/javascript')
            done()
        })
})

it('serves html', (done) => {
    chai.request(app)
        .get('/')
        .end((err, res) => {
            expect(err).to.not.be.ok
            expect(res).to.have.status('200')
            expect(res).to.be.html
            expect(res.text).to.equal('\n')
            done()
        })
})

it('serves templates', (done) => {
    app.engine('html', (filePath, options, callback) => {
        fs.readFile(filePath, (err, content) => {
            content = content.toString().replace(/\{\{([^}]+)\}\}/, (m, p1) => {
                return options[p1]
            })
            callback(null, content)
        })
    })
    app.set('view engine', 'html')
    chai.request(app)
        .get('/')
        .end((err, res) => {
            expect(err).to.not.be.ok
            expect(res).to.have.status('200')
            expect(res).to.be.html
            expect(res.text).to.equal('pass\n')
            done()
        })
})

it('correctly handles events', (done) => {
    let emitted = false
    app.events.once('example', (arg) => {
        emitted = arg
    })
    app.events.emit('example', true)
    expect(emitted).to.be.true
    done()
})
