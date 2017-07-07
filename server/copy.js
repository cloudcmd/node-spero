'use strict';

const copymitter = require('copymitter/legacy');
const mellow = require('mellow');

module.exports = (socket, options) => {
    listen(socket, options || {});
};

function getRoot(root) {
    if (typeof root === 'function')
        return root();
    
    return root;
}

function isRootWin32(path, root) {
    const isRoot = path === '/';
    const isWin32 = process.platform === 'win32';
    const isConfig = root === '/';
    
    return isWin32 && isRoot && isConfig;
}

function getWin32RootMsg() {
    return Error('Could not copy from/to root on windows!');
}

function check(authCheck) {
    if (authCheck && typeof authCheck !== 'function')
        throw Error('authCheck should be function!');
}

function listen(socket, options) {
    const authCheck = options.authCheck;
    const prefix = options.prefix || 'spero';
    const root = options.root   || '/';
    
    check(authCheck);
    
    socket.of(prefix)
        .on('connection', (socket) => {
            if (!authCheck)
                return connection(root, socket);
            
            authCheck(socket, () => {
                connection(root, socket);
            });
        });
}

function connection(root, socket) {
    socket.on('copy', (from, to, files) => {
        const value = getRoot(root);
        
        from = mellow.pathToWin(from, value);
        to = mellow.pathToWin(to, value);
        
        if (![from, to].some((item) => {
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
    const cp = copymitter(from, to, files);
    
    socket.on('pause', cp.pause);
    
    cp.on('file', (name) => {
        socket.emit('file', name);
    });
    
    cp.on('progress', (percent) => {
        socket.emit('progress', percent); 
    });
    
    cp.on('error', (error, name) => {
        const msg = error.code + ' :' + error.path;
        const rm  = () => {
            socket.removeListener('continue', onContinue);
            socket.removeListener('abort', onAbort);
        };
        
        const onAbort = () => {
            cp.abort();
            rm();
        };
        
        const onContinue  = () => {
            cp.continue();
            rm();
        };
        
        socket.emit('err', msg, name);
        socket.on('continue', onContinue);
        socket.on('abort',  onAbort);
    });
    
    cp.on('end', () => {
        socket.emit('end');
        socket.removeListener('pause', cp.pause);
    });
}

