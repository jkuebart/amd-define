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

var repository = (function () {
    'use strict';
    var s_isAbs = RegExp('^(/|[-+.A-Za-z0-9]+:)'); // Test for absolute paths

    /**
     * A container of modules loaded with a specific set of options.
     */
    function repository(options, resolver) {
	var self = {};

	// Promises for each loaded module.
	var m_modules = {};

	function toUrl(id, context) {
	    var ext = idSuffix(id);

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
	    Object.keys(options['paths']).forEach(function (prefix) {
		if (id === prefix || startsWith(id, prefix + '/')) {
		    id = options['paths'][prefix] + id.slice(prefix.length);
		}
	    });

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
		    m_modules[id] = { module: mod };
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
		resolver(context.push({ id: id, repo: self }));

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
	    return repository(assign({}, options, opts), resolver);
	};

	return self;
    }

    return repository;
}());
