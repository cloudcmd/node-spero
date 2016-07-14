'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const test = require('tape');
const freeport = require('freeport');
const io = require('socket.io');
const ioClient = require('socket.io-client');
const spero = require('..');

const connect = (path, options, fn) => {
    if (!path) {
        throw Error('path could not be empty!');
    } else if (!fn && !options) {
        fn = path;
        path = '';
    } else if (!fn) {
        fn = options;
        options = null;
    }
    
    path = path.replace(/^\/|\/$/g, '');
    
    if (!options || !options.prefix) {
        path = 'spero';
    } else {
        const prefix = options.prefix || 'spero';
        path = `${prefix}${!path ? '' : '/' + path}`;
    }
    
    const app = express();
    const server = http.createServer(app);
    
    app.use(spero(options));
    spero.listen(io(server), options);
        
    freeport((error, port) => {
        const ip = '127.0.0.1';
        
        if (options && !Object.keys(options).length)
            options = undefined;
        
        server.listen(port, ip, () => {
            const url = `http://127.0.0.1:${port}/${path}`;
            const socket = ioClient(url);
            
            fn(socket, () => {
                socket.destroy();
                server.close();
            });
        });
    });
};

test('spero: options: prefix', (t) => {
    connect('/', {prefix: 'hello'}, (socket, callback) => {
        socket.on('connect', () => {
            t.pass('connected with prefix');
            t.end();
            callback();
        });
    });
});

test('spero: options: root', (t) => {
    connect('/', {root: __dirname}, (socket, callback) => {
        socket.on('connect', () => {
            const name = String(Math.random());
            const full = path.join(__dirname, name);
            socket.emit('copy', '.', name, ['spero.js']);
            
            socket.on('err', (error) => {
                t.ok(error, error);
                fs.rmdirSync(full);
                t.end();
                callback();
            });
        });
    });
});

test('spero: options: empty object', (t) => {
    connect('/', {}, (socket, callback) => {
        socket.on('connect', () => {
            t.end();
            callback();
        });
    });
});

test('spero: options: authCheck not function', (t) => {
    const authCheck = {};
    const fn = () => {
        connect('/', {authCheck}, () => {
        });
    };
    
    t.throws(fn, /authCheck should be function!/, 'should throw when authCheck not function');
    t.end();
});

test('spero: options: authCheck: wrong credentials', (t) => {
    const authCheck = (socket, fn) => {
        socket.on('auth', (username, password) => {
            if (username === 'hello' && password === 'world')
                fn();
            else
                socket.emit('err', 'Wrong credentials');
        });
    };
    
    connect('/', {authCheck}, (socket, fn) => {
        socket.emit('auth', 'jhon', 'lajoie');
        
        socket.on('err', (error) => {
            t.equal(error, 'Wrong credentials', 'should return error');
            t.end();
            fn();
        });
    });
});

test('spero: options: authCheck: correct credentials', (t) => {
    const authCheck = (socket, fn) => {
        socket.on('auth', (username, password) => {
            if (username === 'hello' && password === 'world')
                fn();
            else
                socket.emit('err', 'Wrong credentials');
        });
    };
    
    connect('/', {authCheck}, (socket, fn) => {
        socket.emit('auth', 'hello', 'world');
        
        socket.on('connect', () => {
            t.pass('should grant access');
            t.end();
            fn();
        });
        
        socket.on('err', (error) => {
            t.notOk(error, 'should not be error');
        });
    });
});

