# Spero

File copy emitter middleware based on [socket.io](http://socket.io "Socket.io") and [copymitter](https://github.com/coderaiser/node-copymitter "Copymitter").

## Install

```
npm i spero --save
```

## How to use?

```js
var spero       = require('spero'),
    http        = require('http'),
    express     = require('express'),
    io          = require('socket.io'),
    app         = express(),
    server      = http.createServer(app);

socket          = io.listen(server),
server.listen(port, ip);

app.use(spero({
    minify: true,
    online: true
});

spero.listen(socket, {
    prefix: 'spero', /* default             */
    root: '/',      /* string or function   */
});
```

## License

MIT
