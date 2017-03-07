module.exports = {
    port: 3000,
    host: '0.0.0.0',
    secret: 'change me',
    hidden: ['secret'],
    max_age: 1000 * 60 * 60 * 24 * 365,
    after(app) {
        const path = require('path')
        const basePath = app.get('base_path')
        let build
        let package

        //build.json for deployment time options
        try {
            build = require(path.join(basePath, 'build.json'))
        } catch (e) {}

        //package.json
        try {
            package = require(path.join(basePath, 'package.json'))
        } catch (e) {}

        const config = {
            build,
            package,
            dist_path: path.join(basePath, 'dist'),
            html: path.join(basePath, 'dist', 'html'),
            views: path.join(basePath, 'dist', 'html'),
        }
        return config
    },
}
