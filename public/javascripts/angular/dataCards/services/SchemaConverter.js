const angular = require('angular');
// A service to convert plain JSON blobs to specific schema versions.
angular.module('dataCards.services').factory('SchemaConverter', function(Schemas) {

  var datasetMetadataSchemas = Schemas.regarding('dataset_metadata');
  var datasetPagesMetadataSchemas = Schemas.regarding('pages_for_dataset_metadata');

  var SchemaConverter = {};

  SchemaConverter.datasetMetadata = {
    /**
     * Takes any version dataset metadata blob and returns
     * an equivalent blob in the v0 schema (as much as is reasonable).
     *
     * Throws if the conversion fails (that's a bug).
     *
     * @param {Object} input The input dataset metadata blob, any schema.
     */
    toV0: function(input) {
      var output = null;

      if (datasetMetadataSchemas.isValidAgainstVersion('1', input)) {
        output = _.cloneDeep(input);

        // Grab column names in a consistent (if arbitrary) order.
        var columnNames = _.keys(input.columns);
        columnNames.sort();

        // This is never read but still somehow required in the schema.
        output.defaultAggregateColumn = output.defaultAggregateColumn || 'INVALID';

        // rowDisplayUnit is optional in v1, with a default of 'row'.
        output.rowDisplayUnit = output.rowDisplayUnit || 'row';

        // Convert columns from a hash to an array.
        output.columns = _.map(columnNames, function(columnName) {
          var columnBlob = _.cloneDeep(input.columns[columnName]);

          if (columnBlob.computationStrategy &&
              columnBlob.computationStrategy.parameters &&
              _.isString(columnBlob.computationStrategy.parameters.region)
            ) {
            // v0 does not want the leading underscore
            columnBlob.shapefile = columnBlob.computationStrategy.parameters.region.replace(/^_/, '');
          }

          // Naming confusion... :(
          // In the input hash, the SODA field name is the hash key, and the column human name is under 'name'.
          // This makes sense.
          //
          // In old models however, we refer to the SODA field name as the name, and the human name as 'title'.
          // This also makes sense.
          //
          // Two great flavors that don't taste great together.
          // This change was made so that 'name' is consistently used to refer to human readable identifiers:
          //  * dataset name
          //  * dataset column name
          //  * page name
          columnBlob.title = columnBlob.title || columnBlob.name;
          columnBlob.name = columnName;

          // Importance is never used, but is again required by the v0 schema.
          columnBlob.importance = columnBlob.importance || 1;

          columnBlob.logicalDatatype = columnBlob.fred;
          columnBlob.cardinality = columnBlob.cardinality || Math.pow(2, 53) - 1; // MAX_SAFE_INT

          delete columnBlob.fred;

          return columnBlob;
        });

      } else if (datasetMetadataSchemas.isValidAgainstVersion('0', input)) {
        output = input;
      } else {
        // Matched nothing. Complain according to the latest schema.
        datasetMetadataSchemas.assertValidAgainstVersion('1', input, 'Dataset metadata did not validate against any version schema.');
      }

      // Final verification of converted blob.
      datasetMetadataSchemas.assertValidAgainstVersion('0', output, 'Failed to backport dataset metadata from schema V1 to V0');

      return output;
    },

    toV1: function(input) {
      // Don't support backporting V1 metadata to any other version.
      datasetMetadataSchemas.assertValidAgainstVersion('1', input);
      return input;
    }
  };

  SchemaConverter.datasetMetadata.pagesForDataset = {
    /**
     * Takes any version dataset page listing blob and returns
     * an equivalent blob in the v0 schema (as much as is reasonable).
     *
     * Throws if the conversion fails (that's a bug).
     *
     * @param {Object} input The input page listing blob, any schema.
     */
    toV0: function(input) {
      var output;

      if (datasetPagesMetadataSchemas.isValidAgainstVersion('1', input)) {
        output = {
          user: [],
          publisher: _.values(input)
        };
      } else if (datasetPagesMetadataSchemas.isValidAgainstVersion('0', input)) {
        output = input;
      } else {
        // Matched nothing. Complain according to the latest schema.
        datasetPagesMetadataSchemas.assertValidAgainstVersion('1', input, 'Dataset pages list metadata did not validate against any version schema.');
      }

      // Final verification of converted blob.
      datasetPagesMetadataSchemas.assertValidAgainstVersion('0', output, 'Failed to backport dataset pages list metadata from schema V1 to V0');

      return output;
    }
  };

  return SchemaConverter;

});
