#!/bin/sh
#
# Run this script from the js@.../ directory containing the current version.
# First, run `npm install uglify-js` for this to work.

node node_modules/uglify-js/bin/uglifyjs \
	-o define.min.js \
	--source-map define.min.map \
	-c -m -v \
	-- define.js
