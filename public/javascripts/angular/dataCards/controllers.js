const angular = require('angular');
/* Controllers */

angular.module('dataCards.controllers', []);

const contextualRequire = require.context('./controllers', true, /^\.\/.*\.js$/);
contextualRequire.keys().forEach(contextualRequire);
