var angular = require('angular');

angular.module('socrataCommon.filters', []).

filter('pageLimitTo', function() {
  return function(data, pagenumber, maxresult) {
    var start = pagenumber * 10;
    var end = start + maxresult;
    if (end > data.length) {
      end = data.length;
    }
    return data.slice(start, end);
  };
});

const contextualRequire = require.context('./filters', true, /^\.\/.*\.js$/);
contextualRequire.keys().forEach(contextualRequire);
