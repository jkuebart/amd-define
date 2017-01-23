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

var define = (function () {
    'use strict';
    var s_isAbs = RegExp('^(/|[-+.A-Za-z0-9]+:)'); // Test for absolute paths
    var s_rem = [ 'require', 'exports', 'module' ];

    // Construct an Error from the arguments.
    function err() {
	return new Error([].join.call(arguments, ': '));
    }

    // A version of lastIndexOf that returns length if not found.
    function lastIndexOf(s, t) {
	return (1 + s.length + s.lastIndexOf(t)) % (1 + s.length);
    }

    // The prefix of a module ID.
    function idPrefix(s) {
	return s.slice(0, 1 + s.lastIndexOf('/'));
    }

    // Return the suffix of a module ID.
    function idSuffix(s) {
	return s.slice(1 + s.lastIndexOf('/'));
    }

    // Polyfill for Object.assign because it's missing on many platforms.
    var assign = Object.assign || function (target) {
	var a, i, k;
	for (i = 1; i < arguments.length; ++i) {
	    a = arguments[i];
	    if (null != a) {
		for (k in a) if ({}.hasOwnProperty.call(a, k)) {
		    target[k] = a[k];
		}
	    }
	}
	return target;
    };

    // Polyfill for String.prototype.startsWith which isn't common
    function startsWith(str, pref) {
	return str.slice(0, pref.length) === pref;
    }

    // An immutable stack to keep track of the dependency hierarchy.
    var stack = (function () {
	var emptyStack = {};

	emptyStack.empty = function () { return true; };
	emptyStack.toString = function () { return ''; };
	emptyStack.some = function () {};
	emptyStack.map = function () { return emptyStack; };

	emptyStack.push = function (item) {
	    var next = this, self = Object.create(emptyStack);
	    self.top = function () { return item; };
	    self.pop = function () { return next; };
	    self.empty = function () { return false; };
	    self.toString = function () { return item +', '+ next; };
	    self.some = function (func) {
		return func(item) || next.some(func);
	    };
	    self.map = function (func) {
		return next.map(func).push(func(item));
	    };
	    return self;
	};

	return function () {
	    return emptyStack;
	};
    }());

    /**
     * A container of modules loaded with a specific set of options.
     */
    function repository(options) {
	var self = {};

	// Promises for each loaded module.
	var m_modules = {};

	function toUrl(id, context) {
	    var prefix, ext = idSuffix(id);

	    if (s_isAbs.test(id)) {
		return id;
	    }

	    // Remove extension.
	    ext = ext.slice(lastIndexOf(ext, '.'));
	    id = id.slice(0, -ext.length);

	    // Resolve relative module ID.
	    if ('.' === id[0] && !context.empty()) {
		id = idPrefix(context.top().id) + id;
	    }

	    // Process . and .. components
	    id = id.split('/').reduce(function (a, p) {
		switch (p) {
		   case '': case '.':	return a;
		   case '..':		return a.slice(0, -1);
		   default:		return a.concat(p);
		}
	    }, []).join('/');

	    // Perform `paths` configuration.
	    for (prefix in options['paths']) {
		if ({}.hasOwnProperty.call(options['paths'], prefix) &&
		    (id === prefix || startsWith(id, prefix + '/')))
		{
		    id = options['paths'][prefix] + id.slice(prefix.length);
		}
	    }

	    // Prefix with `baseUrl` if required, re-add extension.
	    return (s_isAbs.test(id) ? '' : options['baseUrl']) + id + ext;
	}
	self.toUrl = toUrl;

	/**
	 * Define module @id as @mod. Ignored if @id is already defined.
	 */
	self.define = function (id, mod) {
	    if (id) {
		if (!m_modules[id]) {
		    m_modules[id] = { 'module': mod };
		} else if (m_modules[id].resolve) {
		    m_modules[id].resolve(mod);
		}
	    }
	    return self;
	};

	/**
	 * Return (a promise for) the requested module. The context will be
	 * used when processing defines from the loaded module.
	 */
	self.get = function (id, context) {
	    var script, module = m_modules[id];

	    function handleLoad(evt) {
		document.head.removeChild(script);
		script.removeEventListener('error', handleLoad);
		script.removeEventListener('load', handleLoad);

		// Call resolver directly to clear the queue.
		resolver(context.push({ 'id': id, 'repo': self }));

		if ('error' === evt.type) {
		    module.reject(err('define', id, 'load error'));
		} else {
		    // Reject Promise if module is still unresoled.
		    module.reject(err('define', 'unresolved dependency', id));
		}
	    }

	    if (!module) {
		// Create a Promise that resolves when the module is defined.
		module = m_modules[id] = {};
		module.module = new Promise(function (resolve, reject) {
		    module.resolve = resolve;
		    module.reject = reject;
		});

		script = document.createElement('script');
		script.setAttribute('src', toUrl(id +'.js', context));
		script.addEventListener('error', handleLoad);
		script.addEventListener('load', handleLoad);
		document.head.appendChild(script);
	    }

	    return module.module;
	};

	/**
	 * Return a new repository with modified options.
	 */
	self.config = function (opts) {
	    return repository(assign({}, options, opts));
	};

	return self;
    }
    var m_defaultRepo = repository({ 'baseUrl': '', 'paths': {} });

    function requirer(repo, context) {
	/**
	 * If @func is specified, call it with the resolved dependencies in
	 * @env, otherwise return (a Promise for) them.
	 */
	function require(env, func) {
	    // The 'module' object.
	    var module = { 'exports': {} };

	    if ('string' === typeof env) {
		throw err('require', 'synchronous mode unimplemented');
	    }

	    // Optimise for dependency-free module.
	    if (!env.length) {
		return func ? func([]) : [];
	    }

	    // Resolve dependencies in the general case.
	    return Promise.all(env.map(function (id) {
		var mod;

		id = id.split('!');
		switch (id[0]) {
		    case 'exports': return module['exports'];
		    case 'module':  return module;
		    case 'require': return require;
		}
		if (context.some(function (c) { return id[0] === c.id; })) {
		    throw err('require', 'circular dependency',
			context.map(function (c) { return c.id; }).push(id[0])
		    );
		}
		mod = repo.get(id[0], context);
		if (id.length < 2) {
		    return mod;
		}

		// Invoke loader plugin.
		return Promise.resolve(mod).then(function (loader) {
		    return new Promise(function (resolve) {
			loader.load(id.slice(1).join('!'), require, resolve);
		    });
		});
	    })).then(function (deps) {
		return func ? func.apply(void 0, deps) : deps;
	    });
	}

	require['toUrl'] = function (id) {
	    return repo.toUrl(id, context);
	};

	return require;
    }

    // A buffer for define() invocations.
    var m_defines = [];

    /**
     * Process buffered `define` calls.
     */
    function resolver(context) {
	var defines = m_defines, ctx;
	m_defines = [];

	context = context || stack();
	ctx = context.empty() ? {} : context.top();
	defines.forEach(function (mod) {
	    var repo = mod.repo || ctx.repo || m_defaultRepo;

	    repo.define(mod.id || ctx.id,
		// Optimise for pure object module.
		'function' !== typeof mod.mod	? mod.mod :

		// Resolve dependencies in the general case.
		Promise.resolve(requirer(repo, context)(mod.env)).then(function (deps) {
		    var moduleIdx = mod.env.indexOf('module');
		    var exportsIdx = mod.env.indexOf('exports');
		    return mod.mod.apply(void 0, deps)
			|| -1 !== moduleIdx && deps[moduleIdx]['exports']
			|| -1 !== exportsIdx && deps[exportsIdx];
		})
	    );
	});
    }

    // A function to kick off resolving.
    var m_start;
    new Promise(function (resolve) {
	m_start = resolve;
    }).then(resolver);

    /**
     * Create a `define` method with an optional @repo. If no @repo is
     * specified, modules will be inserted into the 'most recent'
     * repository on the dependency chain.
     */
    function definer(repo) {
	/**
	 * Define module @mod with the optional @id. If @mod is a function,
	 * invoke it with the optional dependencies listed in @env.
	 */
	function define(id, env, mod) {
	    // Sort out the arguments.
	    if (arguments.length < 3) {
		mod = arguments[arguments.length - 1];
		if (arguments.length < 2 || 'string' === typeof id) {
		    env = void 0;
		} else { // 2 <= arguments.length && 'string' !== typeof id
		    env = id;
		}
		if (arguments.length < 2 || 'string' !== typeof id) {
		    id = void 0;
		}
	    }
	    if (!env) {
		env = 'function' === typeof mod && mod.length ? s_rem : [];
	    }
	    m_defines.push({ 'id': id, 'env': env, 'mod': mod, 'repo': repo });

	    // Call m_start to start resolving after this script finishes.
	    m_start();
	}

	/**
	 * Return a new loader with a modified configuration.
	 */
	define['config'] = function (options) {
	    return definer((repo || m_defaultRepo).config(options));
	};

	define['amd'] = {};
	return define;
    }

    return definer();
}());
