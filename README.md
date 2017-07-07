# Spero [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL]

File copy emitter middleware based on [socket.io](http://socket.io "Socket.io") and [copymitter](https://github.com/coderaiser/node-copymitter "Copymitter").

## Install

```
npm i spero --save
```

## Client

Could be loaded from url `/spero/spero.js`.

```js
const prefix = '/spero';

/* could be one argument: callback */
spero(prefix, function(copier) {
    const from = '/';
    const to = '/tmp';
    const names = [
        'bin'
    ];
    const progress = (value) => {
        console.log('progress:', value);
    };
    
    const end = () => {
        console.log('end');
        copier.removeListener('progress', progress);
        copier.removeListener('end', end);
    };
    
    const error = (data) => {
        const msg = data + '\n Continue?';
        const is = confirm(msg);
        
        if (is)
            return copier.continue();
        
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
const spero = require('spero');
const http = require('http');
const express = require('express');
const io = require('socket.io');
const app = express();
const port = 1337;
const server = http.createServer(app);
const socket = io.listen(server);

server.listen(port);

app.use(spero({
    online: true,
    authCheck: function(socket, success) {
    }
});

spero.listen(socket, {
    prefix: '/spero',   /* default              */
    root: '/',          /* string or function   */
});
```
## Environments

In old `node.js` environments that supports `es5` only, `dword` could be used with:

```js
var spero = require('spero/legacy');
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

