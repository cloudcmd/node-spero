'use strict';

var copymitter = require('copymitter/legacy');
var mellow = require('mellow');

module.exports = function(socket, options) {
    listen(socket, options || {});
};

function getRoot(root) {
    var value;
    
    if (typeof root === 'function')
        value = root();
    else
        value = root;
    
    return value;
}

function isRootWin32(path, root) {
    var isRoot      = path === '/',
        isWin32     = process.platform === 'win32',
        isConfig    = root === '/';
    
    return isWin32 && isRoot && isConfig;
}

function getWin32RootMsg() {
    var message  = 'Could not copy from/to root on windows!',
        error       = Error(message);
    
    return error;
}

function check(authCheck) {
    if (authCheck && typeof authCheck !== 'function')
        throw Error('authCheck should be function!');
}

function listen(socket, options) {
    var authCheck   = options.authCheck,
        prefix      = options.prefix || 'spero',
        root        = options.root   || '/';
    
    check(authCheck);
    
    socket.of(prefix)
        .on('connection', function(socket) {
            if (!authCheck)
                connection(root, socket);
            else
                authCheck(socket, function() {
                    connection(root, socket);
                });
        });
}

function connection(root, socket) {
    socket.on('copy', function(from, to, files) {
        var value   = getRoot(root);
        
        from        = mellow.pathToWin(from, value);
        to          = mellow.pathToWin(to, value);
        
        if (![from, to].some(function(item) {
            return isRootWin32(item, value);
        })) {
            copy(socket, from, to, files);
        } else {
            socket.emit('err',  getWin32RootMsg());
            socket.emit('end');
        }
    });
}

function copy(socket, from, to, files) {
    var cp = copymitter(from, to, files);
    
    socket.on('pause', cp.pause);
    
    cp.on('file', function(name) {
        socket.emit('file', name);
    });
    
    cp.on('progress', function(percent) {
        socket.emit('progress', percent); 
    });
    
    cp.on('error', function(error, name) {
        var msg         = error.code + ' :' + error.path,
            rm          = function() {
                socket.removeListener('continue', onContinue);
                socket.removeListener('abort', onAbort);
            },
            
            onAbort     = function() {
                cp.abort();
                rm();
            },
            
            onContinue  = function() {
                cp.continue();
                rm();
            };
        
        socket.emit('err', msg, name);
        socket.on('continue', onContinue);
        socket.on('abort',  onAbort);
    });
    
    cp.on('end', function() {
        socket.emit('end');
        socket.removeListener('pause', cp.pause);
    });
}

