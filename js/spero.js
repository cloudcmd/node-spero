var io, load, exec, join, loadRemote;

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports  = new SperoProto();
    else
        global.spero    = new SperoProto();
    
    function SperoProto() {
        var Progress;
        
        function Spero(element, prefix, callback) {
            var el,
                type        = typeof element,
                isString    = type === 'string';
            
            if (!callback) {
                callback    = prefix;
                prefix      = '/spero';
            }
            
            if (isString)
                el  = document.querySelector(element);
            else
                el  = element;
            
            loadAll(prefix, function() {
                Progress = new ProgressProto(prefix);
                
                if (typeof callback === 'function')
                    callback();
            });
        }
        
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
                    var scripts = [
                        '/js/loadremote.js'
                    ];
                    
                    if (!load)
                        scripts.push('/modules/load/load.js');
                    
                    if (!join)
                        scripts.push('/join/join.js');
                    
                    scripts = scripts.map(function(name) {
                        return prefix + name;
                    });
                    
                    exec.if(!scripts.length, callback, function() {
                        loadScript(scripts, callback);
                    });
                },
                
                function(callback) {
                    loadRemote.setPrefix(prefix)
                        .load('socket', {
                            name : 'io',
                            noPrefix: true
                        }, callback);
                },
                
                function(callback) {
                    var load    = window.load,
                        css     = prefix + '/css/style.css';
                    
                    load.css(css, callback);
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
                
                socket.on('err', function(data) {
                    var msg = data + '\n Continue?',
                        is = confirm(msg);
                    
                    if (is)
                        socket.emit('continue');
                    else
                        socket.emit('abort');
                });
                
                socket.on('file', function(name) {
                    console.log(name);
                });
                
                socket.on('progress', function(percent) {
                    console.log(percent);
                });
                
                socket.on('end', function() {
                    console.log('copy ended up');
                });
                
                socket.on('connect', function() {
                    console.log('spero: connected\n');
                });
                
                socket.on('disconnect', function() {
                    console.error('spero: disconnected\n');
                });
            }
            
            this.pause       = function() {
                socket.emit('pause');
            };
            
            this.abort       = function() {
                socket.emit('abort');
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
