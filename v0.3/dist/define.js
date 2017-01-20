var define=function(){"use strict";function n(){return new Error([].join.call(arguments,": "))}function e(n,e){return(1+n.length+n.lastIndexOf(e))%(1+n.length)}function t(n){var r={},o={};return r.toUrl=function(t){var r,o=t.substr(e(t.substr(1+t.lastIndexOf("/")),"."));t=t.substr(0,t.length-o.length);for(r in n.paths)({}).hasOwnProperty.call(n.paths,r)&&(t===r||t.startsWith(r+"/"))&&(t=n.paths[r]+t.substr(r.length));return(c.test(t)?"":n.baseUrl)+t+o},r.declare=function(n,e){var t=o[n];return t||(t=o[n]={},t.module=new Promise(function(n,r){t.resolve=n,t.reject=r,e()})),t.module},r.failure=function(n,e){o[n].reject(e)},r.define=function(n,e){return n&&(o[n]?o[n].resolve&&o[n].resolve(e):o[n]={module:e}),r},r.config=function(e){return t(Object.assign({},n,e))},r}function r(e,t,r){function u(c){document.head.removeChild(i),i.removeEventListener("error",u),i.removeEventListener("load",u),o(r.push({id:e,repo:t})),"error"===c.type?t.failure(e,n("define",e,"load error")):t.failure(e,n("define","unresolved dependency",e))}var i;return t.declare(e,function(){i=document.createElement("script"),i.setAttribute("src",t.toUrl(e+".js")),i.addEventListener("error",u),i.addEventListener("load",u),document.head.appendChild(i)})}function o(e){var t,o=a;a=[],e=e||f(),t=e.empty()?{}:e.top(),o.forEach(function(o){var u,i=o.repo||t.repo||s;i.define(o.id||t.id,"function"!=typeof o.mod?o.mod:o.env.length?Promise.all(o.env.map(function(t){if("exports"===t||"module"===t)return u=u||{exports:{}},"e"===t[0]?u.exports:u;if(e.some(function(n){return t===n.id}))throw n("define","circular dependency",e.map(function(n){return n.id}).push(t));return r(t,i,e)})).then(function(n){return o.mod.apply(void 0,n)||u&&u.exports}):o.mod.call(void 0))})}function u(n){function e(e,t,r){arguments.length<3&&(r=arguments[arguments.length-1],t=arguments.length<2||"string"==typeof e?[]:e,(arguments.length<2||"string"!=typeof e)&&(e=void 0)),a.push({id:e,env:t,mod:r,repo:n}),i()}return e.config=function(e){return u((n||s).config(e))},e.amd={},e}var i,c=RegExp("^(/|[-+.A-Za-z0-9]+:)"),f=function(){var n={};return n.empty=function(){return!0},n.toString=function(){return""},n.some=function(){},n.map=function(){return n},n.push=function(e){var t=this,r=Object.create(n);return r.top=function(){return e},r.pop=function(){return t},r.empty=function(){return!1},r.toString=function(){return e+", "+t},r.some=function(n){return n(e)||t.some(n)},r.map=function(n){return t.map(n).push(n(e))},r},function(){return n}}(),s=t({baseUrl:"",paths:{}}),a=[];return new Promise(function(n){i=n}).then(o),u()}();
//# sourceMappingURL=define.js.map