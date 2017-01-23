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
.SUFFIXES:	.js -src.js

UGLIFYJS	?=	uglifyjs
UGLIFYJSFLAGS	?=	-c -m -v

SRCS		?=	${PROG_JS}
MAP		?=	${PROG_JS:=.map}
DISTSRCS	?=	${SRCS:.js=-src.js}

MINI		=	${PROG_JS:.js=-out.js}

CLEANFILES	+=	${MINI} ${MAP} ${DISTSRCS}

JSOWN		?=	${SHAREOWN}
JSGRP		?=	${SHAREGRP}
JSMODE		?=	${SHAREMODE}

all:		${MINI} ${MAP} ${DISTSRCS}

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
		${MINI} ${DESTDIR}${JSDIR}/${PROG_JS}
	${INSTALL} -o ${JSOWN} -g ${JSGRP} -m ${JSMODE} \
		${MAP} ${DISTSRCS} ${DESTDIR}${JSDIR}

.js-src.js:
	cp -p ${.IMPSRC} ${.TARGET}

${MINI}: ${DISTSRCS}
	${UGLIFYJS} ${UGLIFYJSFLAGS} \
		-o ${.TARGET} \
		--source-map ${MAP} \
		-- ${.ALLSRC}

${MAP}: ${MINI}

.include <bsd.obj.mk>
