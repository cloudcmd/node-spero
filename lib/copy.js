(function() {
    'use strict';
    
    var copymitter  = require('copymitter'),
        mellow      = require('mellow');
    
    module.exports = function(socket, options) {
        if (!options)
            options = {};
        
        listen(socket, options);
    };
    
    function getRoot(root) {
        var value;
        
        if (typeof root === 'function')
            value = root();
        else
            value = root;
        
        return value;
    }
    
    function listen(socket, options) {
        var prefix  = options.prefix || 'spero',
            root    = options.root   || '/';
        
        socket.of(prefix)
            .on('connection', function(socket) {
                socket.on('copy', function(from, to, files) {
                    var value   = getRoot(root);
                    
                    from        = mellow.pathFromWin(from, value);
                    to          = mellow.pathFromWin(to, value);
                    copy(socket, from, to, files);
                });
                
                socket.on('error', function(error) {
                    console.error('spero', error);
                });
                
                socket.on('disconnect', function() {
                    console.log('spero', 'disconnect');
                });
            })
            .on('error', function(error) {
                console.error(error);
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
        
        cp.on('error', function(error, name, i, percent) {
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
                
            console.error(percent, ' -> ', name, ':', error.message);
            
            socket.emit('err', msg, name);
            socket.on('continue', onContinue);
            socket.on('abort',  onAbort);
        });
        
        cp.on('end', function() {
            socket.emit('end');
            socket.removeListener('pause', cp.pause);
        });
    }
    
})();
