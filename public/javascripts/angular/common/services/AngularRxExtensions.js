angular.module('socrataCommon.services').factory('AngularRxExtensions', function(Assert, $log) {
  'use strict';

  var extensions = {
  };

  return {
    // Installs the extensions on the given scope.
    install: function(scope) {
      // Merge, but hard error on naming collisions.
      _.forOwn(extensions, function(implementation, name) {
        if (!_.isUndefined(scope[name]) && scope[name] !== implementation) {
          throw new Error('Naming collision: scope.bindObservable.');
        } else {
          scope[name] = implementation;
        }
      });
    }
  };

});
