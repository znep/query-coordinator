(function() {

  function DatasetDataService(ServerConfig, http, Assert, Schemas, SchemaConverter) {

    var datasetMetadataSchemas = Schemas.regarding('dataset_metadata');

    function fetch(schemaVersion, id) {
      var url;

      if(ServerConfig.metadataMigration.datasetMetadata.shouldReadWriteFromNewEndpoint()) {
        url = '/metadata/v1/dataset/{0}'.format(id);
      } else {
        url = '/dataset_metadata/{0}.json'.format(id);
      }

      var config = {
        cache: true,
        requester: this
      };

      return http.get(url, config).
        then(function(response) {
          return SchemaConverter.datasetMetadata.toV0(response.data);
        }
      );
    }

    this.getDatasetMetadata = function(schemaVersion, id) {
      Assert(_.isString(id), 'id should be a string');
      Assert(schemaVersion === '0', 'only dataset metadata schema v0 is supported.');

      return fetch.call(this, schemaVersion, id).then(function(data) {
        datasetMetadataSchemas.assertValidAgainstVersion(schemaVersion, data);
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
      Assert(_.isString(datasetId), 'datasetId should be a string');

      var url;
      if(ServerConfig.metadataMigration.datasetMetadata.shouldReadWriteFromNewEndpoint()) {
        url = '/metadata/v1/dataset/{0}/pages'.format(datasetId);
      } else {
        url = '/dataset_metadata/?id={0}&format=json'.format(datasetId);
      }

      var config = {
        cache: true,
        requester: this
      };

      return http.get(url, config).then(_.property('data')).then(SchemaConverter.datasetMetadata.pagesForDataset.toV0);
    };

  }

  angular.
    module('dataCards.services').
    service('DatasetDataService', DatasetDataService);

})();
