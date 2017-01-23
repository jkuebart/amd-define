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

function requirer(repo, context) {
    'use strict';
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
		    context.map(function(c) { return c.id; }).push(id[0])
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
