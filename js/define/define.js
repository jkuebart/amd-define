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

	self.toUrl = function (id) {
	    var prefix;
	    var ext = id.substr(lastIndexOf(id.substr(1 + id.lastIndexOf('/')), '.'));
	    id = id.substr(0, id.length - ext.length);
	    for (prefix in options['paths']) {
		if ({}.hasOwnProperty.call(options['paths'], prefix) &&
		    (id === prefix || id.startsWith(prefix + '/')))
		{
		    id = options['paths'][prefix] + id.substr(prefix.length);
		}
	    }
	    return (s_isAbs.test(id) ? '' : options['baseUrl']) + id + ext;
	};

	/**
	 * Invoke @func if module @id hasn't been declared or defined.
	 */
	self.declare = function (id, func) {
	    var module = m_modules[id];

	    if (!module) {
		module = m_modules[id] = {};
		module.module = new Promise(function (resolve, reject) {
		    module.resolve = resolve;
		    module.reject = reject;
		    func();
		});
	    }

	    return module.module;
	};

	/**
	 * Signal failure @reason when loading the module @id. The @id must
	 * have been previously declared.
	 */
	self.failure = function (id, reason) {
	    m_modules[id].reject(reason);
	};

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
	 * Return a new repository with modified options.
	 */
	self.config = function (opts) {
	    return repository(Object.assign({}, options, opts));
	};

	return self;
    }
    var m_defaultRepo = repository({ 'baseUrl': '', 'paths': {} });

    function load(url) {
	var xhr = new XMLHttpRequest();

	xhr.open('GET', url);
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
     * used when processing defines from the loaded module.
     */
    function get(id, repo, context) {
	// Create a Promise that resolves when the module is defined.
	return repo.declare(id, function () {
	    // Load and execute the module script.
	    load(repo.toUrl(id +'.js')).then(function (text) {
		var geval = eval;

		// Prevent starting the resolver as we will run it later.
		m_start = function () {};
		try {
		    geval(text);
		} finally {
		    // Call resolver directly to clear the queue.
		    resolver(context.push({ 'id': id, 'repo': repo }));
		    // Reject Promise if module is still unresoled.
		    repo.failure(id, err('define', 'unresolved dependency', id));
		}
	    });
	});
    }

    // A buffer for define() invocations.
    var m_defines = [];

    // A function to kick off resolving.
    var m_start;

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

	    // The 'module' object if the dependencies request it.
	    var module;

	    repo.define(mod.id || ctx.id,
		// Optimise for pure object module.
		'function' !== typeof mod.mod	? mod.mod :

		// Optimise for dependency-free module.
		!mod.env.length			? mod.mod.call(void 0) :

		// Resolve dependencies in the general case.
		Promise.all(mod.env.map(function (dep) {
		    if ('exports' === dep || 'module' === dep) {
			module = module || { 'exports': {} };
			return 'e' === dep[0] ? module['exports'] : module;
		    }
		    if (context.some(function (c) { return dep === c.id; })) {
			throw err('define', 'circular dependency',
			    context.map(function (c) {
				return c.id;
			    }).push(dep)
			);
		    }
		    return get(dep, repo, context);
		})).then(function (deps) {
		    return mod.mod.apply(void 0, deps)
			|| module && module.exports;
		})
	    );
	});

	new Promise(function (resolve) {
	    m_start = resolve;
	}).then(resolver);
    }
    resolver();

    /**
     * Create a `define` method with an optional @repo. If no @repo is
     * specified, modules will be inserted into the 'most recent'
     * repository on the dependency chain.
     */
    function definer(repo) {
	/**
	 * Define module `mod` with the optional `id`. If `mod` is a function,
	 * invoke it with the optional dependencies listed in `env`.
	 */
	function define(id, env, mod) {
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
