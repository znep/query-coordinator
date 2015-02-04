(function() {

  function DatasetDataService(ServerConfig, http, Assert, Schemas) {

    var datasetMetadataSchemas = Schemas.regarding('dataset_metadata');

    function fetch(schemaVersion, id) {
      var url = '/dataset_metadata/{0}.json'.format(id);
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

    this.getDatasetMetadata = function(schemaVersion, id) {
      Assert(_.isString(id), 'id should be a string');
      Assert(schemaVersion === '0', 'only dataset metadata schema v0 is supported.');
      return fetch.call(this, schemaVersion, id).then(function(data) {
        var validation = datasetMetadataSchemas.validateAgainstVersion(schemaVersion, data);
        if (_.isPresent(validation.errors)) {
          throw new Error(
            'Data from dataset metadata endpoint failed validation. Schema version: {0}\nErrors: {1}\nData: {2}'.format(
              schemaVersion, JSON.stringify(validation.errors), JSON.stringify(data)
            )
          );
        }

        return data;
      });
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
    this.getPagesForDataset = function(pageSchemaVersion, datasetId) {
      Assert(pageSchemaVersion === '0', 'only page metadata schema v0 is supported.');
      Assert(!ServerConfig.metadataMigration.datasetMetadata.shouldReadWriteFromNewEndpoint(), 'new endpoints not supported');

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
