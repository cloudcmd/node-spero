'use strict';

const DIR_ROOT = __dirname + '/..';
const path = require('path');

const currify = require('currify/legacy');
const express = require('express');
const Router = express.Router;

const copy = require('./copy');

const speroFn = currify(_speroFn);
const isDev = process.env.NODE_ENV === 'development';

module.exports = (options) => {
    options = options || {};
    const router = Router();
    const prefix = options.prefix || '/spero';
    
    router.route(prefix + '/*')
        .get(speroFn(options))
        .get(staticFn)
    
    return router;
};

module.exports.listen = (socket, options) => {
    if (!options)
        options = {};
    
    if (!options.prefix)
        options.prefix = 'spero';
    
    if (!options.root)
        options.root = '/';
    
    copy(socket, options);
};

function _speroFn(options, req, res, next) {
    const o = options || {};
    const prefix = o.prefix || '/spero';
    const url = req.url
    
    if (url.indexOf(prefix))
        return next();
    
    req.url = req.url.replace(prefix, '');
    
    if (/^\/(spero|0)\.js(\.map)?$/.test(req.url))
        req.url = '/dist' + req.url;
    
    if (isDev)
        req.url = req.url.replace(/^\/dist\//, '/dist-dev/');
    
    next();
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

