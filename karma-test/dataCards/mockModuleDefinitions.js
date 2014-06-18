// We exclude app.js from the tests, as we don't need it and it adds lots of module dependencies. So
// we mock out its module definitions here.
var dataCards = angular.module('dataCards', [
  'test',
  'socrataCommon.directives',
  'dataCards.controllers',
  'dataCards.models',
  'leaflet-directive',
  'dataCards.directives'
]);

