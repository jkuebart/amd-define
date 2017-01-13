/*
 * Copyright 2017, Joachim Kuebart <joachim.kuebart@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   1. Redistributions of source code must retain the above copyright
 *	notice, this list of conditions and the following disclaimer.
 *
 *   2. Redistributions in binary form must reproduce the above copyright
 *	notice, this list of conditions and the following disclaimer in the
 *	documentation and/or other materials provided with the
 *	distribution.
 *
 *   3. Neither the name of the copyright holder nor the names of its
 *	contributors may be used to endorse or promote products derived
 *	from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

var define = (function ctor(m_global, m_options) {
    'use strict';

    // Construct an Error from the arguments.
    function err() {
	return new Error([].join.call(arguments, ': '));
    }

    // A version of lastIndexOf that returns length if not found.
    function lastIndexOf(s, t) {
	return (1 + s.length + s.lastIndexOf(t)) % (1 + s.length);
    }

    // An immutable stack to keep track of the dependency hierarchy.
    var stack = (function () {
	var emptyStack = {};

	emptyStack.empty = function () { return true; };
	emptyStack.toString = function () { return ''; };
	emptyStack.includes = function () { return false; };

	emptyStack.push = function (item) {
	    var next = this, self = Object.create(emptyStack);
	    self.top = function () { return item; };
	    self.pop = function () { return next; };
	    self.empty = function () { return false; };
	    self.toString = function () { return item +', '+ next; };
	    self.includes = function (i) {
		return i === item || next.includes(i);
	    };
	    return self;
	};

	return function () {
	    return emptyStack;
	};
    }());

    // The registry of resolved modules
    var m_registry = (function () {
	var m_context, self = {};

	// Promises for each loaded module.
	var m_modules = {};

	function load(url) {
	    var xhr = new XMLHttpRequest();

	    xhr.open('GET', url, true);
	    return new Promise(function (resolve, reject) {
	       xhr.onload = function () {
		    if (200 === this.status) {
			resolve(this.response);
		    } else {
			reject(err(url, this.status, this.statusText));
		    }
	       };
	       xhr.send();
	    });
	}

	/**
	 * Return (a promise for) the requested module. The context will be
	 * available via `context()` while the body is being evaluated.
	 */
	self.get = function (id, context) {
	    var module;

	    if (!m_modules[id]) {
		// Load and execute the module script.
		load(idToUrl(id +'.js')).then(function (text) {
		    var geval = eval, gdef = m_global.define;

		    /*
		     * We modify the global environment to point to this
		     * instance of `define` for the duration of evaluating
		     * the module.
		     */
		    m_global.define = define;
		    m_context = context;
		    try {
			geval(text);
		    } finally {
			m_context = void 0;
			m_global.define = gdef;
			// Reject Promise if module is still unresoled.
			module.reject(err('define', 'unresolved dependency', id));
		    }
		});

		// Create a Promise that resolves when the module is defined.
		module = m_modules[id] = {};
		module.module = new Promise(function (resolve, reject) {
		    module.resolve = resolve;
		    module.reject = reject;
		});
	    }
	    return m_modules[id].module;
	};

	self.context = function () {
	    return m_context;
	};

	/**
	 * Store the given object at the module id. If the id is already in
	 * use, the request is ignored.
	 */
	self.put = function (id, mod) {
	    if (id) {
		if (!m_modules[id]) {
		    m_modules[id] = { 'module': mod };
		} else if (m_modules[id].resolve) {
		    m_modules[id].resolve(mod);
		}
	    }
	    return self;
	};

	return self;
    }());

    /**
     * Define module `mod` with the optional `id`. If `mod` is a function,
     * invoke it with the optional dependencies listed in `env`.
     */
    function define(id, env, mod) {
	// The 'exports' object if the module uses it.
	var exports;

	// Capture the hierarchy of modules currently being defined.
	var defining = m_registry.context() || stack();

	// Sort out the arguments.
	if (arguments.length < 3) {
	    mod = arguments[arguments.length - 1];
	    if (arguments.length < 2 || 'string' === typeof id) {
		env = [];
	    } else { // 2 <= arguments.length && 'string' !== typeof id
		env = id;
	    }
	    if (arguments.length < 2 || 'string' !== typeof id) {
		id = void 0;
	    }
	}

	id = id || !defining.empty() && defining.top();
	if ('function' !== typeof mod) {
	    // optimize for pure object module
	    m_registry.put(id, mod);
	} else if (!env.length) {
	    // optimize for dependency-free module
	    m_registry.put(id, mod());
	} else {
	    m_registry.put(id,
		Promise.all(env.map(function (dep) {
		    if ('exports' === dep) {
			return exports = exports || {};
		    }
		    if (defining.includes(dep)) {
			throw err('define', 'circular dependency', defining.push(dep));
		    }
		    return m_registry.get(dep, defining.push(dep));
		})).then(function (deps) {
		    var res = mod.apply(void 0, deps);
		    return exports || res;
		})
	    );
	}

	return define;
    }

    var m_isAbs = RegExp('^(/|[-+.A-Za-z0-9]+:)'); // Test for absolute paths
    function idToUrl(id) {
	var prefix;
	var ext = id.substr(lastIndexOf(id.substr(1 + id.lastIndexOf('/')), '.'));
	id = id.substr(0, id.length - ext.length);
	for (prefix in m_options.paths) {
	    if ({}.hasOwnProperty.call(m_options.paths, prefix) &&
		(id === prefix || id.startsWith(prefix + '/')))
	    {
		id = m_options.paths[prefix] + id.substr(prefix.length);
	    }
	}
	return (m_isAbs.test(id) ? '' : m_options.baseUrl) + id + ext;
    }

    /**
     * Return a new loader with a modified configuration.
     */
    define.config = function (options) {
	return ctor(m_global, Object.assign({}, m_options, options));
    };

    /*
     * Define built-in dependencies.
     *
     * DOMContentLoaded must be attached synchronously.
     *
     * FIXME this is wrong if an instance is defined asynchronously. Should
     * be global!
     */
    var m_domReady = new Promise(function (resolve) {
	document.addEventListener('DOMContentLoaded', resolve);
    });
    define('domReady', function () {
	return function (func) { m_domReady.then(func); };
    });

    define.amd = {};
    return define;
}(this, { 'baseUrl': '', 'paths': {} }));
