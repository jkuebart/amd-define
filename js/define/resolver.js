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

var resolver = (function () {
    'use strict';
    var m_defaultRepo = repository({ 'baseUrl': '', 'paths': {} });

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

    resolver.push = function (id, env, mod, repo) {
	m_defines.push({ id: id, env: env, mod: mod, repo: repo });
    };

    resolver.defaultRepo = function () {
	return m_defaultRepo;
    };

    return resolver;
}());
