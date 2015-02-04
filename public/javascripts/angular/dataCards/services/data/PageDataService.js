(function() {

  'use strict';

  function PageDataService(http, Assert) {

    function fetch(id) {
      var url = '/page_metadata/{0}.json'.format(id);
      var config = {
        cache: true,
        requester: this
      };

      return http.get(url, config).
        then(function(response) {
          return response.data;
        }
      );
    }

    this.getPageMetadata = function(id) {
      Assert(_.isString(id), 'id should be a string');
      return fetch.call(this, id);
    };

    this.save = function(pageData, id) {
      var idIsDefined = _.isDefined(id);
      Assert(_.isObject(pageData), 'pageData should be an object');
      if (idIsDefined) {
        Assert(_.isString(id), 'id should be a string');
      }
      var json = JSON.stringify(pageData);
      var config = {
        data: { pageMetadata:  json },
        method: idIsDefined ? 'PUT' : 'POST',
        url: idIsDefined ? '/page_metadata/{0}.json'.format(id) : '/page_metadata.json',
        requester: this
      };

      return http(config);
    };

    this.requesterLabel = function() {
      return 'page-data-service';
    };

  }

  angular.
    module('dataCards.services').
    service('PageDataService', PageDataService);

})();
