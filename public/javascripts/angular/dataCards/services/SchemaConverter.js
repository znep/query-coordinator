angular.module('dataCards.services').factory('SchemaConverter', function(Schemas) {

  var datasetMetadataSchemas = Schemas.regarding('dataset_metadata');

  var SchemaConverter = {};

  SchemaConverter.datasetMetadata = {
    toV0: function(input) {
      var output = null;

      if (datasetMetadataSchemas.isValidAgainstVersion('1', input)) {
        output = _.cloneDeep(input);

        // Grab column names in a consistent (if arbitrary) order.
        var columnNames = _.keys(input.columns);
        columnNames.sort();

        // This is never read but still somehow required in the schema.
        output.defaultAggregateColumn = output.defaultAggregateColumn || 'INVALID';

        // rowDisplayUnit is optional in v1.
        output.rowDisplayUnit = output.rowDisplayUnit || 'row';

        // Convert columns from a hash to an array.
        output.columns = _.map(columnNames, function(columnName) {
          var columnBlob = _.cloneDeep(input.columns[columnName]);

          if (columnBlob.computationStrategy &&
              columnBlob.computationStrategy.parameters &&
              _.isString(columnBlob.computationStrategy.parameters.region)
            ) {
            columnBlob.shapefile = columnBlob.computationStrategy.parameters.region.replace(/^_/g, ''); // v0 does not want the leading underscore
          }

          columnBlob.importance = columnBlob.importance || 1;
          columnBlob.logicalDatatype = columnBlob.fred;
          columnBlob.cardinality = columnBlob.cardinality || Math.pow(2, 53) - 1; // MAX_SAFE_INT
          delete columnBlob.fred;
          delete columnBlob.computationStrategy;

          return columnBlob;
        });

      } else if (datasetMetadataSchemas.isValidAgainstVersion('0', input)){
        output = input;
      } else {
        // Complain according to the latest schema.
        datasetMetadataSchemas.assertValidAgainstVersion('1', input);
      }

      datasetMetadataSchemas.assertValidAgainstVersion('0', output);

      return output;
    }
  }

  return SchemaConverter;

});
