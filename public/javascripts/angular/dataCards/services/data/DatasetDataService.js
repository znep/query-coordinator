(function() {
  'use strict';

  function DatasetDataService(ServerConfig, http, Assert, Schemas, SchemaConverter) {

    var datasetMetadataSchemas = Schemas.regarding('dataset_metadata');

    function fetch(schemaVersion, id) {
      var url = $.baseUrl('/metadata/v1/dataset/{0}.json'.format(id));

      var config = {
        cache: true,
        requester: this,
        headers: {
          'Content-Type': 'application/json'
        },
        data: '' // Without a blank body, $http will eat Content-Type :(
      };

      var schemaConversionFunction = SchemaConverter.datasetMetadata['toV{0}'.format(schemaVersion)];
      Assert(
        _.isFunction(schemaConversionFunction),
        "Don't know how to synthesize dataset metadata for v{0} schema".format(schemaVersion)
      );

      return http.get(url.href, config).
        then(function(response) {
          return schemaConversionFunction(response.data);
        }
      );
    }

    this.getDatasetMetadata = function(schemaVersion, id) {
      Assert(_.isString(id), 'id should be a string');
      Assert(schemaVersion === '1', 'Only schema V1 of dataset metadata is supported.');

      return fetch.call(this, schemaVersion, id).then(function(data) {
        datasetMetadataSchemas.assertValidAgainstVersion(schemaVersion, data);
        return data;
      });
    };

    this.getGeoJsonInfo = function(id, additionalConfig) {
      Assert(_.isString(id), 'id should be a string');
      var url = $.baseUrl('/resource/{0}.geojson'.format(id));

      var config = _.extend({
        headers: {
          'Accept': 'application/vnd.geo+json'
        },
        cache: true,
        requester: this
      }, additionalConfig);

      return http.get(url.href, config);
    };

    this.requesterLabel = function() {
      return 'dataset-data-service';
    };

    // Get all pages which use this dataset, as JSON blobs.
    // If you want models instead, use the Dataset model's pages property.
    this.getPagesForDataset = function(pageSchemaVersion, datasetId) {
      Assert(pageSchemaVersion === '0', 'only page metadata schema v0 is supported.');
      Assert(_.isString(datasetId), 'datasetId should be a string');

      var url = $.baseUrl('/metadata/v1/dataset/{0}/pages.json'.format(datasetId));

      var config = {
        cache: true,
        requester: this,
        headers: {
          'Content-Type': 'application/json'
        },
        data: '' // Without a blank body, $http will eat Content-Type :(
      };

      return http.get(url.href, config).
        then(_.property('data')).
        then(SchemaConverter.datasetMetadata.pagesForDataset.toV0);
    };

  }

  angular.
    module('dataCards.services').
    service('DatasetDataService', DatasetDataService);

})();
