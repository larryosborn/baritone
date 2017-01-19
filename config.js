const path = require('path');

exports.config = (app) => {
    const basePath = app.get('base_path');

    const config = {
        dist_path: path.join(basePath, 'dist'),
        html: path.join(basePath, 'dist', 'html'),
        views: path.join(basePath, 'dist', 'html'),
        port: 3000,
        host: '0.0.0.0',
        secret: 'change me',
        hidden: ['secret'],
        max_age: 1000 * 60 * 60 * 24 * 365,
    };

    //build.json for deployment time options
    try {
        const buildFile = path.join(basePath, 'build.json');
        config.build = require(buildFile);
    } catch (e) {}

    //package.json
    try {
        const packageFile = path.join(basePath, 'package.json');
        config.package = require(packageFile);
    } catch (e) {}

    return config;
};
