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

/**
 * Construct an Error from the arguments.
 * @param {...string} msgs
 */
function err(msgs) {
    'use strict';
    return new Error([].join.call(arguments, ': '));
}

// A version of lastIndexOf that returns length if not found.
function lastIndexOf(s, t) {
    'use strict';
    return (1 + s.length + s.lastIndexOf(t)) % (1 + s.length);
}

// The prefix of a module ID.
function idPrefix(s) {
    'use strict';
    return s.slice(0, 1 + s.lastIndexOf('/'));
}

// Return the suffix of a module ID.
function idSuffix(s) {
    'use strict';
    return s.slice(1 + s.lastIndexOf('/'));
}

// Polyfill for Object.assign because it's missing on many platforms.
var assign = Object.assign || function (target) {
    'use strict';
    var a, i;
    for (i = 1; i < arguments.length; ++i) {
	a = arguments[i];
	if (null != a) {
	    Object.keys(a).forEach(function (k) {
		target[k] = a[k];
	    });
	}
    }
    return target;
};

// Polyfill for String.prototype.startsWith which isn't common
function startsWith(str, pref) {
    'use strict';
    return str.slice(0, pref.length) === pref;
}
