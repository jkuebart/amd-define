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

var definer = (function () {
    'use strict';
    var s_rem = [ 'require', 'exports', 'module' ];

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
	    resolver.push(id, env, mod, repo);

	    // Call m_start to start resolving after this script finishes.
	    m_start();
	}

	/**
	 * Return a new loader with a modified configuration.
	 */
	define['config'] = function (options) {
	    return definer((repo || resolver.defaultRepo()).config(options));
	};

	define['amd'] = {};
	return define;
    }

    return definer;
}());
