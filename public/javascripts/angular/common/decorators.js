const angular = require('angular');

angular.module('socrataCommon.decorators', ['rx']);

const contextualRequire = require.context('./decorators', true, /^\.\/.*\.js$/);
contextualRequire.keys().forEach(contextualRequire);
