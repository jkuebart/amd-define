// Define a sub-module
define('sub', { 'hello': 'world' });

// The library's main module
define([ 'sub' ], function (sub) {
    return { 'hello': 'hello, '+ sub.hello };
});
