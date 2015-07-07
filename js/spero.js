var io, load, exec, join, Emitify, loadRemote;

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports  = new SperoProto();
    else
        global.spero    = new SperoProto();
    
    function SperoProto() {
        var Progress;
        
        function Spero(prefix, callback) {
            if (!callback) {
                callback    = prefix;
                prefix      = '/spero';
            }
            
            loadAll(prefix, function() {
                Progress = new ProgressProto(prefix);
                Object.setPrototypeOf(Spero, Emitify());
                
                if (typeof callback === 'function')
                    callback();
            });
        }
        
        Spero.copy  = function(from, to, files) {
            Progress.copy(from, to, files);
        };
        
        Spero.abort = function() {
            Progress.abort();
        };
        
        Spero.pause = function() {
            Progress.pause();
        };
        
        Spero.continue = function() {
            Progress.continue();
        };
        
        function loadAll(prefix, callback) {
            var scripts = [];
            
            if (!exec)
                scripts.push('/modules/execon/lib/exec.js');
            
            if (!scripts.length)
                loadFiles(prefix, callback);
            else
                loadScript(scripts.map(function(name) {
                    return prefix + name;
                }), function() {
                    loadFiles(prefix, callback);
                }); 
        }
        
        function loadFiles(prefix, callback) {
            exec.series([
                function(callback) {
                    var obj     = {
                            loadRemote  : '/js/loadremote.js',
                            load        : '/modules/load/load.js',
                            join        : '/join/join.js',
                            Emitify     : '/modules/emitify/lib/emitify.js'
                        },
                        
                        scripts = Object.keys(obj)
                            .filter(function(name) {
                                return !window[name];
                            })
                            .map(function(name) {
                                return prefix + obj[name];
                            });
                    
                    exec.if(!scripts.length, callback, function() {
                        loadScript(scripts, callback);
                    });
                },
                
                function(callback) {
                    loadRemote('socket', {
                        name : 'io',
                        prefix: prefix,
                        noPrefix: true
                    }, callback);
                },
                
                function() {
                    callback();
                }
            ]);
        }
        
        function loadScript(srcs, callback) {
            var i       = srcs.length,
                func    = function() {
                    --i;
                    
                    if (!i)
                        callback();
                };
            
            srcs.forEach(function(src) {
                var element = document.createElement('script');
                
                element.src = src;
                element.addEventListener('load', function load() {
                    func();
                    element.removeEventListener('load', load);
                });
                
                document.body.appendChild(element);
            });
        }
        
        function ProgressProto(room) {
            var socket;
            
            init(room);
            
            function init(room) {
                var href            = getHost(),
                    FIVE_SECONDS    = 5000;
                
                socket = io.connect(href + room, {
                    'max reconnection attempts' : Math.pow(2, 32),
                    'reconnection limit'        : FIVE_SECONDS
                });
                
                socket.on('err', function(error) {
                    Spero.emit('error', error);
                });
                
                socket.on('file', function(name) {
                    Spero.emit('file', name);
                });
                
                socket.on('progress', function(percent) {
                    Spero.emit('progress', percent);
                });
                
                socket.on('end', function() {
                    Spero.emit('end');
                });
                
                socket.on('connect', function() {
                    Spero.emit('connect');
                });
                
                socket.on('disconnect', function() {
                    Spero.emit('disconnect');
                });
            }
            
            this.pause       = function() {
                socket.emit('pause');
            };
            
            this.continue   = function() {
                socket.emit('continue');
            };
            
            this.abort       = function() {
                socket.emit('abort');
            };
            
            this.copy       = function(from, to, files) {
                socket.emit('copy', from, to, files);
            };
            
            function getHost() {
                var l       = location,
                    href    = l.origin || l.protocol + '//' + l.host;
                
                return href;
            }
        }
        
        return Spero;
    }
    
})(this);
