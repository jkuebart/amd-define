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

.SUFFIXES:
.SUFFIXES:	.js .map -src.js

UGLIFYJS	?=	uglifyjs
UGLIFYJSFLAGS	?=	-c -m -v

SRCS		?=	${PROG_JS}
MAP		?=	${PROG_JS:.js=.map}
DISTSRCS	?=	${SRCS:.js=-src.js}

CLEANFILES	+=	${PROG_JS} ${MAP} ${DISTSRCS}

JSOWN		?=	${SHAREOWN}
JSGRP		?=	${SHAREGRP}
JSMODE		?=	${SHAREMODE}

# Depend on the map file because the minified output may have the same name
# as one of the sources, which confuses make(1).
all:		${MAP}

.PHONY:		install
install:
	@if ! test -d ${DESTDIR}${JSDIR}; then \
		mkdir -p ${DESTDIR}${JSDIR}; \
		if ! test -d ${DESTDIR}${JSDIR}; then \
			${ECHO} "Unable to create ${DESTDIR}${JSDIR}."; \
			exit 1; \
		fi; \
	fi
	${INSTALL} -o ${JSOWN} -g ${JSGRP} -m ${JSMODE} \
		${PROG_JS} ${MAP} ${DISTSRCS} ${DESTDIR}${JSDIR}

# Bail out if running without .OBJDIR because we'd overwrite sources.
.BEGIN:
.if !make(obj) && ${.OBJDIR} == ${.CURDIR}
.error First do make obj
.endif

.js-src.js:
	cp -p ${.IMPSRC} ${.TARGET}

${MAP}: ${DISTSRCS}
	${UGLIFYJS} ${UGLIFYJSFLAGS} \
		-o ${.TARGET:.map=.js} \
		--source-map ${.TARGET} \
		-- ${.ALLSRC}

.include <bsd.obj.mk>
