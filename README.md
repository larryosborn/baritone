#Baritone

A barebone express server.

Baritone is a superset of express. You can use Baritone as if it is an express instance, including all
express methods. The only method Baritone overrides is `render`

##Why?

Because express still has a lot of boiler plate, as well as some common problems to overcome.

###Boiler plate?

* Config setup
* Common middleware such as static, compress
* Starting a server with proper logging

###Common problems?

* All modules sharing the same config. Discussed in further detail in Baritone.app()
* Code organization. Discussed in further detail in Baritone.import()

##Quick start

```javascript
var baritone = require('baritone');
var app = baritone.app();
app.import('.', 'baritone');
app.start();
```

##Static Methods

###Baritone.app()

Retrieves the *shared* baritone instance, effectively turning express into a singleton. All modules
that use `baritone.app()` will interface with the same underlying express app.

This is different than how invoking `express()` directly works. Invoking `express()` always gives you
a new express instance. However, this can be unwanted behavior if you want share an express instance
among separate modules. Without Baritone, sharing the same express instance was acheived through circular
dependencies or globals. Globals are usually frowned upon, and while circular dependencies are supported
in node, they can get a little hairy.

##Instance Methods

###baritone.import(...paths)

Attempts to require `./routes`, `./middleware`, and `./config` within the path provided. A path can also
be an npm module. For example, in your own app you'll want to `import('baritone')` to load in baritone's
default routes, middleware, and config. Using `import('.')` will load the routes, middleware, and config
from the main app's directory.

###baritone.start()

Starts a web server. The address and port are retrieved from the config. By default this is 0.0.0.0 and 3000
respectively. You can change these values by importing your own config file or setting PORT and HOST
environment variables.

###bartione.render(req, res, view)

If the request is an XHR, it responds with the `{view: view, data: res.locals}`. If the request is not an XHR,
it will send the html file set by the `html` config option. It's up to your client code to retrieve view modules
via XHR based on the current URL. Note that this method calls `res.send()`, effectively ending the request
for you.
