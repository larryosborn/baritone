gulp = require 'gulp'
server = require 'gulp-develop-server'
livereload = require 'gulp-livereload'
coffee = require 'gulp-coffee'
runSequence = require 'run-sequence'
del = require 'del'
notify = require 'gulp-notify'
coffeelint = require 'gulp-coffeelint'
mocha = require 'gulp-mocha'
pkg = require './package'

handleErrors = ->
    args = Array.prototype.slice.call(arguments)
    # Send error to notification center with gulp-notify
    notify.onError(title: 'Compile Error', message: '<%= error.message %>').apply(this, args)
    # Keep gulp from hanging on this task
    this.emit('end')

gulp.task 'default', ['build']

gulp.task 'build', (callback) ->
    runSequence('clean', 'coffee', callback)

gulp.task 'clean', (callback) ->
    del ['./dist'], callback

gulp.task 'coffee', ->
    gulp.src './src/**/*.coffee'
        .pipe coffeelint()
        .pipe coffeelint.reporter()
        .pipe coffee(bare: true).on('error', handleErrors)
        .pipe gulp.dest 'dist'

gulp.task 'test', ['build'], ->
    gulp.src './dist/**/test.js'
        .pipe mocha
            reporter: 'spec'
        .on 'error', (err) -> console.error err

gulp.task 'server', ['build'], ->
    server.listen
        path: pkg.main
        env:
            PORT: process.env.PORT or 3000
            HOST: process.env.LISTEN or '0.0.0.0'
            NODE_ENV: process.env.NODE_ENV or 'development'
    livereload.listen()
    gulp.watch './src/**/*.coffee', ['coffee', server.restart]
    gulp.watch('./dist/**').on('change', livereload.changed)
