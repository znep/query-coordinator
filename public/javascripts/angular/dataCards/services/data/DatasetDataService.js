(function() {

  function DatasetDataService(http, Assert, ServerConfig) {

    function fetch(id) {
      var url = null;
      if (ServerConfig.get('useViewStubs')) {
        url = '/stubs/datasets/{0}.json'.format(id);
      } else {
        url = '/dataset_metadata/{0}.json'.format(id);
      }
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

    this.getBaseInfo = function(id) {
      Assert(_.isString(id), 'id should be a string');
      return fetch.call(this, id);
    };

    this.getGeoJsonInfo = function(id, additionalConfig) {
      Assert(_.isString(id), 'id should be a string');
      var url = '/resource/{0}.geojson'.format(id);

      var config = _.extend({
        headers: {
          'Accept': 'application/vnd.geo+json'
        },
        cache: true,
        requester: this
      }, additionalConfig);

      return http.get(url, config);
    }

    this.requesterLabel = function() {
      return 'dataset-data-service';
    };

    // Get all pages which use this dataset, as JSON blobs.
    // If you want models instead, use the Dataset model's pages property.
    this.getPagesForDataset = function(datasetId) {
      var url = '/dataset_metadata/?id={0}&format=json'.format(datasetId);

      var config = {
        cache: true,
        requester: this
      };

      return http.get(url, config).then(_.property('data'));
    };

  }

  angular.
    module('dataCards.services').
    service('DatasetDataService', DatasetDataService);

})();
