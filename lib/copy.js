(function() {
    'use strict';
    
    var copymitter = require('copymitter');
    
    module.exports = function(socket, options) {
        if (!options)
            options = {};
        
        listen(socket, options);
    };
    
    function listen(socket, options) {
        var prefix  = options.prefix || 'spero';
        
        socket.of(prefix)
            .on('connection', function(socket) {
                socket.on('copy', function(from, to, files) {
                    copy(socket, from, to, files);
                });
                
                socket.on('error', function(error) {
                    console.error('spero', error);
                });
                
                socket.on('disconnect', function() {
                    console.log('spero', 'disconnect');
                });
            });
    }
    
    function copy(socket, from, to, files) {
        var cp = copymitter(from, to, files);
        
        socket.once('abort', function() {
            cp.abort();
        });
        
        cp.on('file', function(name) {
            socket.emit('file', name);
        });
        
        cp.on('progress', function(percent) {
            socket.emit('progress', percent);
        });
        
        cp.on('error', function(error, name, i, percent) {
            console.error(percent, ' -> ', name, ':', error.message);
            
            socket.emit('err', error, name);
            socket.once('continue', function() {
                cp.continue();
            });
        });
        
        cp.on('end', function() {
            socket.emit('end');
            console.log('end');
        });
    }
    
})();
