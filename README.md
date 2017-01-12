AMD-Define
==========

So here it is – my submission to the [AMD loader][AMD] fray.

The aim here is to be minimally working and not comprehensive or complete.
Some of my projects are so tiny they don't warrant a loader three times
their own size, while still benefitting from the modularity and dependency
resolution they provide.

Note that in case a circular dependency is detected, an Error will be
reported. This is in contrast to [some other][CYC] AMD loaders that quietly
soldier on.


Examples
--------

Here's an example of how to load Mike Bostock's [D3](https://d3js.org/):

```html
<!doctype html>
<title>AMD-Define example</title>
<script src="js/define.js"></script>
<script type="text/javascript">
    define([ 'https://d3js.org/d3.v4.min' ], function (d3) {
        d3.select('div').text('Hello, D3!');
    });
</script>
<div></div>
```
\[[see](examples/hello-d3.html)\]


Built-in dependencies
---------------------

The [`domReady`][DR] dependency is built-in. The reason is that it is
usually too late to attach to the `DOMContentLoaded` event by the time a
module is loaded asynchronously.

This is how it's used:

```html
<!doctype html>
<title>AMD-Define example</title>
<script src="js/define.js"></script>
<script type="text/javascript">
    define([ 'domReady' ], function (domReady) {
        domReady(function () {
            document.write('hello, world!');
        });
    });
</script>
```
\[[see](examples/domReady.html)\]


Another built-in pseudo-module is `exports`. When specified as a
dependency, a new object is created and passed to the module function. This
object will later become the module and it is expected that the module
function defines anything it wishes to export as properties on this object.
The return value of the module function is ignored in this case.

```javascript
define([ 'exports' ], function (exports) {
    exports.f = function () {};
});
```


Libraries
---------

When `define` is called, it normally uses the module id from the dependency
that caused the file to be loaded as the id of the module being defined.
That's why ordinary modules shouldn't specify an `id` themselves when
calling `define`.

However, libraries are typically created by combining several modules into
a single file. This results in several calls to `define` from within that
same file, making it impossible to deduce the names of the modules being
defined.

That's why the module id may be explicitly specified as the first argument
to `define`. Just like regular modules, the main module of the library
should not specify a model id.

```javascript
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
with a modified configuration which may be used to replace the global
instance:

```javascript
define = define.config({
    'paths': { 'd3': 'https://d3js.org/d3.v4.min' },
});
```

It's also possible to use the customised loader without affecting the
global environment. Modules loaded this way will then use the *modified*
loader as the global instance when their dependencies are resolved.

```javascript
(function () {
   // This function uses a specially configured loader.
   var lib1 = define.config({ 'baseUrl': 'lib1/' });
   lib1([ 'mod1' ], function (mod1) {});
}());
```

The loaders created by `config` are completely independent of each other.
This means that even modules that have already been loaded will be loaded
again by other loader instances. This is necessary because their
dependencies might be resolved differently under the new configuration.

The configuration options and their meanings are:

* `paths`
  As a first step when finding a dependency, the module name is
  (repeatedly) looked up in this object and substituted by the values.

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

```javascript
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
that isn't mentioned above. For example, no normalisation is performed on
module ID's, so names containing `.` or `..` elements will be treated
incorrectly. Most notably missing are [loader plugins][PLUG]. There's also
no support for the special dependencies [`require`][REQ0] and
[`module`][CJS].

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
[CYC]:  http://www.requirejs.org/docs/api.html#circular
[DR]:   http://www.requirejs.org/docs/api.html#pageload
[UMD]:  https://github.com/umdjs/umd
[PLUG]: https://github.com/amdjs/amdjs-api/blob/master/LoaderPlugins.md
[REQ0]:	https://github.com/amdjs/amdjs-api/blob/master/require.md
[CJS]:  http://www.requirejs.org/docs/api.html#cjsmodule
[REQ1]:	http://www.requirejs.org/docs/whyamd.html#sugar
