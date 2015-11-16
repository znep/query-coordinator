const angular = require('angular');
angular.module('dataCards.services', ['rx']);

const contextualRequire = require.context('./services', true, /^\.\/.*\.js$/);
contextualRequire.keys().forEach(contextualRequire);
