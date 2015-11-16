const angular = require('angular');
angular.module('dataCards.directives', ['rx', 'socrataCommon.decorators']);

const contextualRequire = require.context('./directives', true, /^\.\/.*\.js$/);
contextualRequire.keys().forEach(contextualRequire);
