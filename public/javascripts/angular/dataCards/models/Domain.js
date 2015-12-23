const angular = require('angular');
function DomainModelFactory(Model) {
  return Model.extend({
    init: function(domainMetadata) {
      // not making this an observable for the time being
      this.categories = domainMetadata.categories || [];
    }
  });
}

angular.
  module('dataCards.models').
  factory('Domain', DomainModelFactory);
