# Copyright 2017, Joachim Kuebart <joachim.kuebart@gmail.com>
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
#    1. Redistributions of source code must retain the above copyright
#	notice, this list of conditions and the following disclaimer.
#
#    2. Redistributions in binary form must reproduce the above copyright
#	notice, this list of conditions and the following disclaimer in the
#	documentation and/or other materials provided with the
#	distribution.
#
#    3. Neither the name of the copyright holder nor the names of its
#	contributors may be used to endorse or promote products derived
#	from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
# LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.

FILESGROUPS	=	FILES MODFILES
FILES		=	domReady.html hello-d3.html lib.html lib.js mod.html
FILESDIR	=	/examples
MODFILES	=	mod/mod.js mod/sub0.js mod/sub1.js
MODFILESDIR	=	${FILESDIR}/mod
NO_OBJ		=

beforeinstall:
	if ! test -d ${DESTDIR}${MODFILESDIR}; then \
		mkdir -p ${DESTDIR}${MODFILESDIR}; \
		if ! test -d ${DESTDIR}${MODFILESDIR}; then \
			${ECHO} "Unable to create ${DESTDIR}${MODFILESDIR}."; \
			exit 1; \
		fi; \
	fi;

.include <bsd.prog.mk>
