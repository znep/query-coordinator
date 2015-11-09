angular.module('dataCards.models', ['dataCards.services']);

const contextualRequire = require.context('./models', true, /^\.\/.*\.js$/);
contextualRequire.keys().forEach(contextualRequire);
