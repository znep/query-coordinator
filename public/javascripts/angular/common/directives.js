const angular = require('angular');
/* Directives */
angular.module('socrataCommon.directives', ['rx']);

const contextualRequire = require.context('./directives', true, /^\.\/.*\.js$/);
contextualRequire.keys().forEach(contextualRequire);
