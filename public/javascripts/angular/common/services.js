const angular = require('angular');

angular.module('socrataCommon.services', ['rx', 'socrataCommon.decorators']);

const contextualRequire = require.context('./services', true, /^\.\/.*\.js$/);
contextualRequire.keys().forEach(contextualRequire);
