'use strict';

/* global io */

import Emitify from 'emitify/legacy';
import {js as loadJs} from 'load.js';

export default (prefix, socketPath, callback) => {
    if (!callback) {
        if (!socketPath) {
            callback    = prefix;
            prefix      = '/omnes';
        } else {
            callback    = socketPath;
            socketPath  = '';
        }
    }
    
    socketPath += '/socket.io';
    
    loadSocket(prefix, () => {
        init();
        
        if (typeof callback === 'function')
            callback(Omnes(prefix, socketPath));
    });
}

function loadSocket(prefix, fn) {
    if (window.io)
        return fn();
    
    loadJs(`${prefix}/dist/socket.io.js`, fn);
}

function Omnes(prefix, socketPath) {
    if (!(this instanceof Omnes))
        return new Omnes(prefix, socketPath);
    
    Emitify.call(this);
    this._progress = ProgressProto(prefix, socketPath, this);
}

function init() {
    Omnes.prototype = Object.create(Emitify.prototype);
    
    Omnes.prototype.extract = function(from, to) {
        this._progress.extract(from, to);
    };
}

function ProgressProto(room, socketPath, omnes) {
    const href = getHost();
    const FIVE_SECONDS = 5000;
    
    if (!(this instanceof ProgressProto))
        return new ProgressProto(room, socketPath, omnes);
    
    const socket = io.connect(href + room, {
        'max reconnection attempts' : Math.pow(2, 32),
        'reconnection limit'        : FIVE_SECONDS,
        path                        : socketPath
    });
    
    omnes.on('auth', (username, password) => {
        socket.emit('auth', username, password);
    });
    
    socket.on('accept', () => {
        omnes.emit('accept');
    });
    
    socket.on('reject', () => {
        omnes.emit('reject');
    });
    
    socket.on('err', (error) => {
        omnes.emit('error', error);
    });
    
    socket.on('file', (name) => {
        omnes.emit('file', name);
    });
    
    socket.on('progress', (percent) => {
        omnes.emit('progress', percent);
    });
    
    socket.on('end', () => {
        omnes.emit('end');
    });
    
    socket.on('connect', () => {
        omnes.emit('connect');
    });
    
    socket.on('disconnect', () => {
        omnes.emit('disconnect');
    });
    
    this.abort = () => {
        socket.emit('abort');
    };
    
    this.extract = (from, to) => {
        socket.emit('extract', from, to);
    };
    
    function getHost() {
        const l = location;
        const href = l.origin || l.protocol + '//' + l.host;
        
        return href;
    }
}

