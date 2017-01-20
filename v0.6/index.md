dietAMD
=======

So here it is – my submission to the [AMD loader][AMD] fray.

The aim here is to be minimally working and not comprehensive, complete or
compatible. Some of my projects are so tiny they don't warrant a loader
three times their own size, while still benefitting from the modularity and
dependency resolution they provide.

This loader makes use of commonly available [ECMAScript 6][ES6] features
such as Promises and won't work in environments that lack them.

Note that in case a circular dependency is detected, an Error will be
reported. This is in contrast to [some other][CYC] AMD loaders that quietly
soldier on.

This package provides one function called `define`. It is usually called
with two parameters, an array of module IDs and a function to which these
dependencies should be passed (see [Examples](#examples)).

In order to resolve the dependencies, the module IDs are used to find
scripts which are then loaded and executed. These scripts are expected to
call `define` themselves in order to provide a definition for the module.
The module is usually the return value of the function passed as `define`'s
second parameter, but see [Built-in
pseudo-modules](#built-in-pseudo-modules) for alternatives.

In the simplest case, module IDs are converted into URLs by appending
`.js`. It is possible to specify a `baseUrl` in the
[configuration](#configuration) pointing to the location of the modules.

Much like path names, module IDs are considered to consist of components
separated by `/`. The `paths` configuration allows specifying replacements
for prefixes of such components, making it possible to create individual
»namespaces« of modules loaded from different locations.

Finally, if a module specifies its dependencies using IDs starting with a
`.`, they will be interpreted relative to that module's own ID. In the
following example, if the module is loaded as `mod/mod`, it will attempt to
load its dependency using the module ID `mod/sub`.

```js
define([ './sub' ], function (sub) {
    // Use the submodule as sub.
});
```

[Loader plugins](#loader-plugins) provide another special kind of module
ID.


Examples
--------

Here's an example of how to load Mike Bostock's [D3](https://d3js.org/):

```html
<!doctype html>
<title>dietAMD example</title>
<script src="define.js"></script>
<script>
    define([ 'https://d3js.org/d3.v4.min' ], function (d3) {
        d3.select('body').text('Hello, D3!');
    });
</script>
```
\[[see](examples/hello-d3.html)\]


Built-in pseudo-modules
-----------------------

One provided pseudo-module is [`require`][REQ0]. When specified as a
dependency, a function is passed to the module function. This function may
be used to request further dependencies by passing an array of module IDs
and a callback to be invoked with the requested modules.

This can be used to load modules dynamically, for example based on some
runtime conditions.

```js
define([ 'require' ], function (require) {
    require([ 'mod' ], function (mod) {
        // Use the requested module.
    });
});
```

As an extension to the AMD standard, if no callback is passed to `require`,
a [Promise][PRM] for an array of dependencies will be returned.

```js
define([ 'require' ], function (require) {
    require([ 'mod' ]).then(function (deps) {
        // The requested module is in deps[0].
    });
});
```


Another pseudo-module is [`module`][CJS]. When specified as a dependency,
an object is passed to the module function. The object contains a property
named `exports` which references a newly created object.

If the module function's return value is [falsy][FLS], then the object
referenced by the `exports` property at the time the module function
returns will become the module and the module function is expected to
define anything it wishes to export on this object.

```js
define([ 'module' ], function (module) {
    // This module exports one function.
    module.exports.f = function () {};
});
```


A third pseudo-module is `exports`. When specified as a dependency, a new
object is created and passed to the module function. If the module
function's return value is [falsy][FLS] and the `module` pseudo-dependency
has not been requested, then this object will become the module.

```js
define([ 'exports' ], function (exports) {
    // This module exports one function.
    exports.f = function () {};
});
```


If `define` is called with a module function that expects arguments (i.e.
has a non-zero length), but without specifying any dependencies, then the
dependencies `[ 'require', 'exports', 'module' ]` are passed to the module
function.


Loader plugins
--------------

[Loader plugins][PLUG] provide other resource types than JavaScript code.
If a dependency contains a `!` character, the module specified by the ID
before the `!` is loaded and its `load` method is invoked, passing the
remaining part of the dependency string as a parameter. The `load` function
should expect three arguments: `id`, `require` and `onLoad`. The first
argument will receive the trailing part of the dependency string. The
second argument receives a `require` function that can be used to load
resources relative to the module that invoked the loader plugin. And the
final parameter is a function to be invoked with the value of the resource
when it is available.


Included modules
----------------

The [`domReady`][DR] module is included in this project. It evaluates to a
function that will invoke its argument exactly once after the DOM has
loaded completely. This is how it's used:

```html
<!doctype html>
<title>dietAMD example</title>
<script src="define.js"></script>
<script>
    define([ 'domReady' ], function (domReady) {
        domReady(function () {
            document.write('hello, world!');
        });
    });
</script>
```
\[[see](examples/domReady.html)\]


The `domReady` module can also be used as a loader plugin to slightly
reduce the boilerplate. In this case, the dependency resolves once the DOM
is ready and the document is passed to the function as the value of the
dependency.

```js
define([ 'domReady!' ], function (doc) {
    document.write('hello, world!');
});
```


The `text`, `json` and `xml` plugins are also included. They evaluate to
the contents of the specified module ID loaded as the respective data type.

```js
define([ 'text!file.txt' ], function (file) {
   var div = document.createElement('div');
   div.textContent = file;
   document.body.appendChild(div);
});
```
\[[text](examples/text.html)\]
\[[json](examples/data.html)\]



Libraries
---------

When `define` is called, it normally uses the module ID from the dependency
that caused the file to be loaded as the ID of the module being defined.
That's why ordinary modules shouldn't specify an `id` themselves when
calling `define`.

However, libraries are typically created by combining several modules into
a single file. This results in several calls to `define` from within that
same file, making it impossible to deduce the names of the modules being
defined.

That's why the module ID may be explicitly specified as the first argument
to `define`. Just like regular modules, the main module of the library
should not specify a module ID.

```js
// Define a sub-module
define('sub', { 'hello': 'world' });

// The library's main module
define([ 'sub' ], function (sub) {
    return { 'hello': 'hello, '+ sub.hello };
});
```
\[[see](examples/lib.html)\]

Modules defined in this way by libraries are also available outside of the
library that defined them.


Configuration
-------------

The configuration is very minimal. The `config` method returns a new loader
with the specified configuration which can be used without affecting the
global environment. Modules will *inherit* the loader they were loaded with
when resolving their dependencies.

```js
// Create a loader for a specific baseUrl.
var libDefine = define.config({ 'baseUrl': 'lib/' });
libDefine([ 'mod' ], function (mod) {});
```

The loaders created by `config` are completely independent of each other.
This means that even modules that have already been loaded will be loaded
again when a new loader is created. This is necessary because a module's
dependencies might be resolved differently under a new configuration.

The global `define` is special in that it resolves dependencies using the
»most recent« loader on the dependency chain. Installing a configured
loader globally isn't recommended as it will break this behaviour. Even
dependencies of a module loaded using a specially configured loader will
then always use this global instance instead of the one they inherit.

```js
// Not recommended!
define = define.config({
    'paths': { 'd3': 'https://d3js.org/d3.v4.min' },
});
```


The configuration options and their meanings are:

* `paths`
  As a first step when finding a dependency, if a prefix of the module ID
  components matches a property in this object, it is replaced with the
  corresponding value. For the purpose of prefix detection, the module ID
  is considered to consist of components separated by `/` excluding an
  optional extension separated by `.`.

* `baseUrl`
  If a dependency does not start with `/` or a URL scheme, this string is
  inserted at the front. It defaults to the empty string, so modules are
  loaded from the same location as the main page.

As a last step, `.js` is appended to the module name to form the final URL.
This is not configurable.


Universal module definition
---------------------------

I'm sure you're burning to know how to create modules that will work
whether or not an AMD loader is present. If you're not into build tools,
you can use a »universal module definition« ([UMD][UMD]) and this is my
suggestion:

```js
(function(r){return r.define||function(e,m){r.Mod=(m||e)($)};}(this))
([ 'jquery' ], function ($) {
    return {
        // …
    };
});
```

If no AMD loader is present, the module will be made available through the
global name `Mod` in this example.

If an AMD loader is present, a global binding for the module is not
created. Consequently, if any code in your project provides a loader, then
modules using this UMD will *only* be available through AMD.

The downside of this pattern and most common source of errors is that the
list of dependencies (`$` in the example) must be repeated in the »mangled«
line and manually kept in sync.


Limitations
-----------

There are certainly a lot of unimplemented features – in fact, everything
that isn't mentioned above.

And don't even get me started about »[source scanning][REQ1]« to support
`require`…

The upshot is that the code is small, so it's straightforward to add
anything when needed.


Alternatives
------------

If the previous section put you off, you might like to consider the
following alternative AMD loaders:

* [RequireJS](http://requirejs.org/)
* [curl](https://github.com/cujojs/curl)
* [lsjs](https://github.com/zazl/lsjs)
* [Dojo](http://dojotoolkit.org/)

If you're anything like me, you'll quickly get fed up with the sheer number
of available loaders and their respective bloat and shortcomings, so just
write your own :P


[AMD]:  https://github.com/amdjs/amdjs-api/blob/master/AMD.md
[CJS]:  http://www.requirejs.org/docs/api.html#cjsmodule
[CYC]:  http://www.requirejs.org/docs/api.html#circular
[DR]:   http://www.requirejs.org/docs/api.html#pageload
[ES6]:  http://www.ecma-international.org/ecma-262/6.0/
[FLS]:  https://github.com/requirejs/requirejs/wiki/Differences-between-the-simplified-CommonJS-wrapper-and-standard-AMD-define#how-does-it-work
[PLUG]: https://github.com/amdjs/amdjs-api/blob/master/LoaderPlugins.md
[PRM]:  http://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects
[REQ0]: https://github.com/amdjs/amdjs-api/blob/master/require.md
[REQ1]: http://www.requirejs.org/docs/whyamd.html#sugar
[UMD]:  https://github.com/umdjs/umd


Build and Installation
======================

The build process is based on BSD make. If you're on a BSD platform, set
the `DESTDIR` environment variable to your web deployment location and run
the familiar

```sh
make all install
```

On other platforms you can use [bmake][MAKE], for example.

The build uses [UglifyJS2][UJS]. If not installed globally, set the
`UGLIFYJS` environment variable to its location.

The `make release` command installs the results of the build process in the
`dest` directory of the source tree ready for packaging.


[MAKE]: http://crufty.net/help/sjg/bmake.html
[UJS]:  http://lisperator.net/uglifyjs/
