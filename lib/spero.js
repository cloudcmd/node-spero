(function() {
    'use strict';
    
    var DIR_ROOT            = __dirname + '/..',
        
        path                = require('path'),
        
        join                = require('join-io'),
        mollify             = require('mollify'),
        
        copy                = require('./copy'),
        
        minifyFunc          = mollify({
            dir     : DIR_ROOT
        });
    
    module.exports          = function(options) {
        return serve.bind(null, options);
    };
    
    module.exports.listen   = function(socket, options) {
        var ret;
        
        if (!options)
            options = {};
        
        if (!options.prefix)
            options.prefix = 'spero';
        
        if (!options.root)
            options.root = '/';
        
        copy(socket, options);
        
        return ret;
    };
    
    function checkOption(isOption) {
        var is,
            type    = typeof isOption;
        
        switch(type) {
        case 'function':
            is = isOption();
            break;
        
        case 'undefined':
            is = true;
            break;
        
        default:
            is = isOption;
        }
        
        return is;
    }
    
    function serve(options, req, res, next) {
        var joinFunc, isJoin, isConfig,
            
            o           = options || {},
            
            isMin       = checkOption(o.minify),
            isOnline    = checkOption(o.online),
            
            url         = req.url,
            prefix      = o.prefix || '/spero',
            
            isSpero    = !url.indexOf(prefix),
            
            URL         = prefix + '/spero.js',
            CONFIG      = prefix + '/options.json',
            
            PATH        = '/js/spero.js',
            sendFile    = function() {
                url = path.normalize(DIR_ROOT + url);
                res.sendFile(url);
            };
        
        if (!isSpero) {
            next();
        } else {
            isJoin      = !url.indexOf(prefix + '/join');
            isConfig    = url === CONFIG;
            
            if (url === URL)
                url = PATH;
            else
                url = url.replace(prefix, '');
            
            req.url = url;
            
            if (isConfig) {
                res .type('json')
                    .send({
                        online: isOnline
                    });
            } else if (isMin) {
                minifyFunc(req, res, sendFile);
            } else if (!isJoin) {
                sendFile();
            } else {
                joinFunc = join({
                    dir     : DIR_ROOT,
                    minify  : isMin
                });
                
                joinFunc(req, res, next);
            }
        }
    }
})();
