# Spero

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
spero(prefix, function() {
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
            spero.removeListener('progress', progress);
            spero.removeListener('end', end);
        },
    
    error   = function(data) {
        var msg = data + '\n Continue?',
            is = confirm(msg);
        
        if (is)
            spero.continue();
        else
            spero.abort();
    };
    
    spero(from, to, names);
    
    spero.on('progress', progress);
    spero.on('end', end);
    spero.on('error', error);
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
    online: true
});

spero.listen(socket, {
    prefix: '/spero',   /* default              */
    root: '/',          /* string or function   */
});
```

## License

MIT
