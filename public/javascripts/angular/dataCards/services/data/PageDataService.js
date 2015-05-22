(function() {

  'use strict';

  function PageDataService(http, ServerConfig, Assert, Schemas) {
    var schemas = Schemas.regarding('page_metadata');

    function fetch(id) {
      var url = $.baseUrl('/metadata/v1/page/{0}.json'.format(id));
      var config = {
        cache: true,
        requester: this
      };

      return http.get(url.href, config).
        then(function(response) {
          return response.data;
        }
      );
    }

    this.getPageMetadata = function(id) {
      Assert(_.isString(id), 'id should be a string');
      return fetch.call(this, id);
    };

    /**
     * @throws {Error} on validation error. The thrown object has a 'validation' property, that
     * contains the validation errors from JJV.
     */
    this.save = function(pageData, id) {
      var idIsDefined = _.isDefined(id);
      Assert(_.isObject(pageData), 'pageData should be an object');
      if (idIsDefined) {
        Assert(_.isString(id), 'id should be a string');
      }

      // Validate
      var validation = schemas.validateAgainstVersion('0', pageData);
      if (!validation.valid) {
        var error = new Error('Validation error');
        error.validation = validation.errors.validation;
        throw error;
      }

      var json = JSON.stringify(pageData);
      var url = $.baseUrl(idIsDefined ? '/metadata/v1/page/{0}.json'.format(id) : '/metadata/v1/page.json');
      var config = {
        data: json,
        method: idIsDefined ? 'PUT' : 'POST',
        url: url.href,
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
