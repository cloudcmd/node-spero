'use strict';

const Emitify = require('emitify/legacy');
const io = require('socket.io-client/dist/socket.io');

module.exports = (prefix, socketPath, callback) => {
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
    
    init();
    
    if (typeof callback === 'function')
        callback(Spero(prefix, socketPath));
}

function Spero(prefix, socketPath) {
    if (!(this instanceof Spero))
        return new Spero(prefix, socketPath);
    
    Emitify.call(this);
    this._progress = ProgressProto(prefix, socketPath, this);
}

function init() {
    Spero.prototype = Object.create(Emitify.prototype);
    
    Spero.prototype.copy = function(from, to, files) {
        this._progress.copy(from, to, files);
    };
    
    Spero.prototype.abort = function() {
        this._progress.abort();
    };
    
    Spero.prototype.pause = function() {
        this._progress.pause();
    };
    
    Spero.prototype.continue = function() {
        this._progress.continue();
    };
}

function ProgressProto(room, socketPath, spero) {
    if (!(this instanceof ProgressProto))
        return new ProgressProto(room, socketPath, spero);
    
    const href = getHost();
    const FIVE_SECONDS = 5000;
    
    const socket = io.connect(href + room, {
        'max reconnection attempts' : Math.pow(2, 32),
        'reconnection limit'        : FIVE_SECONDS,
        path: socketPath,
    });
    
    spero.on('auth', (username, password) => {
        socket.emit('auth', username, password);
    });
    
    socket.on('accept', () => {
        spero.emit('accept');
    });
    
    socket.on('reject', () => {
        spero.emit('reject');
    });
    
    socket.on('err', (error) => {
        spero.emit('error', error);
    });
    
    socket.on('file', (name) => {
        spero.emit('file', name);
    });
    
    socket.on('progress', (percent) => {
        spero.emit('progress', percent);
    });
    
    socket.on('end', () => {
        spero.emit('end');
    });
    
    socket.on('connect', () => {
        spero.emit('connect');
    });
    
    socket.on('disconnect', () => {
        spero.emit('disconnect');
    });
    
    this.pause = () => {
        socket.emit('continue');
    };
    
    this.continue = () => {
        socket.emit('continue');
    };
    
    this.abort = () => {
        socket.emit('abort');
    };
    
    this.copy = (from, to, files) => {
        socket.emit('copy', from, to, files);
    };
    
    function getHost() {
        const l = location;
        const href = l.origin || l.protocol + '//' + l.host;
        
        return href;
    }
}

