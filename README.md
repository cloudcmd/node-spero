# Spero [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL]

File copy emitter middleware based on [socket.io](http://socket.io "Socket.io") and [copymitter](https://github.com/coderaiser/node-copymitter "Copymitter").

## Install

```
npm i spero --save
```

## Client

Could be loaded from url `/spero/spero.js`.

```js
var prefix = '/spero';

/* could be one argument: callback */
spero(prefix, function(copier) {
    var from        = '/',
        to          = '/tmp',
        names       = [
            'bin'
        ],
        progress    = function(value) {
            console.log('progress:', value);
        },
        
        end     = function() {
            console.log('end');
            copier.removeListener('progress', progress);
            copier.removeListener('end', end);
        },
    
    error   = function(data) {
        var msg = data + '\n Continue?',
            is = confirm(msg);
        
        if (is)
            copier.continue();
        else
            copier.abort();
    };
    
    copier(from, to, names);
    
    copier.on('progress', progress);
    copier.on('end', end);
    copier.on('error', error);
});

```

## Server

```js
var spero       = require('spero'),
    http        = require('http'),
    express     = require('express'),
    io          = require('socket.io'),
    app         = express(),
    port        = 1337,
    server      = http.createServer(app),
    socket      = io.listen(server);
    
server.listen(port);

app.use(spero({
    minify: true,
    online: true,
    authCheck: function(socket, success) {
    }
});

spero.listen(socket, {
    prefix: '/spero',   /* default              */
    root: '/',          /* string or function   */
});
```

## License

MIT

[NPMIMGURL]:                https://img.shields.io/npm/v/spero.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/coderaiser/node-spero.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/coderaiser/node-spero/master.svg?style=flat
[NPMURL]:                   https://npmjs.org/package/spero "npm"
[DependencyStatusURL]:      https://gemnasium.com/coderaiser/node-spero "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"
[BuildStatusURL]:           https://travis-ci.org/coderaiser/node-spero  "Build Status"

