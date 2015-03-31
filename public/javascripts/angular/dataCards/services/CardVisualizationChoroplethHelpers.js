(function() {
  'use strict';

  function CardVisualizationChoroplethHelpers(Constants, ServerConfig, $log) {

    /**
     * Extracts the shapeFile from a dataset metadata column.
     *
     * @param {Object} column
     *
     * @return {String} shapeFile
     */
    function extractShapeFileFromColumn(column) {

      function reportMissingProperty(property) {
        $log.error(
          'Could not determine column shapeFile: "{0}" not present on column "{1}".'.
          format(property, column.name)
        );
      }

      var shapeFile = null;

      if (!column.hasOwnProperty('computationStrategy')) {
        reportMissingProperty('computationStrategy');
      } else if (!column.computationStrategy.hasOwnProperty('parameters')) {
        reportMissingProperty('parameters');
      } else if (!column.computationStrategy.parameters.hasOwnProperty('region')) {
        reportMissingProperty('region');
      } else {
        shapeFile = column.computationStrategy.parameters.region.replace(/_/, '');
      }

      return shapeFile;

    }

    /**
     * Extracts the source_column from a computed dataset metadata column.
     *
     * @param {Object} column
     *
     * @return {String} sourceColumn
     */
    function extractSourceColumnFromColumn(column) {

      function reportMissingProperty(property) {
        $log.warn(
          'Could not determine column sourceColumn: "{0}" not present on column "{1}".'.
          format(property, column.name)
        );
      }

      var sourceColumn = null;

      if (!column.hasOwnProperty('computationStrategy')) {
        reportMissingProperty('computationStrategy');
      } else if (!column.computationStrategy.hasOwnProperty('source_columns')) {
        reportMissingProperty('source_columns');
      } else if (column.computationStrategy['source_columns'].length === 0) {
        $log.warn(
          'Could not determine column sourceColumn: "source_columns" present but empty.'
        );
      } else {
        if (column.computationStrategy['source_columns'].length > 1) {
          $log.warn(
            'Could not determine column sourceColumn: "source_columns" ' +
            'contains multiple values but only the first is currently used.'
          );
        }
        sourceColumn = column.computationStrategy['source_columns'][0];
      }

      return sourceColumn;

    }

    /**
     * Creates a slimmed-down version of the supplied geojson shapeFile that
     * includes per-region aggreagate data and the preferred geometryLabel.
     *
     * @param {String} geometryLabel - The name of the property that should be
     *   used as the 'human-readable' name for a region.
     * @param {Object} geojsonRegions - The source GeoJSON shape file.
     * @param {Object} unfilteredDataAsHash - The aggregate unfiltered values
     *   associated with each region.
     * @param {Object} filteredDataAsHash - The aggregate filtered values
     *   associated with each region.
     * @param {String[]} activeFilters - An array of currently-filtered regions
     *   keyed by id.
     *
     * @return {Object} - A GeoJSON shape file.
     *   @property {Object} crs - The GeoJSON shape file's coordinate reference
     *     system (CRS). We do not modify this.
     *   @property {Object[]} features - An array of GeoJSON feature objects
     *     with the following properties:
     *     @property {Object} geometry - The feature's geometry property.
     *     @property {Object} properties - The properties associated with this
     *       feature augmented with the unfiltered and filtered aggregate
     *       values with which it is associated.
     *     @property {String} type - The GeoJSON type associated with this
     *       feature.
     *   @property {String} type - The GeoJSON Type associated with this shape
     *     file.
     */
    function mergeRegionAndAggregateData(
      geometryLabel,
      geojsonRegions,
      unfilteredDataAsHash,
      filteredDataAsHash,
      activeFilterNames) {

        var newFeatures = geojsonRegions.features.filter(
          function(geojsonFeature) {

            return (
              geojsonFeature.properties.hasOwnProperty(
                Constants.INTERNAL_DATASET_FEATURE_ID
              ) &&
              geojsonFeature.properties[Constants.INTERNAL_DATASET_FEATURE_ID]
            );
          }
        ).map(
          function(geojsonFeature) {

            var name = geojsonFeature.
              properties[Constants.INTERNAL_DATASET_FEATURE_ID];
            var humanReadableName = '';

            if (_.isString(geometryLabel) &&
              geojsonFeature.properties.hasOwnProperty(geometryLabel)) {

              humanReadableName = geojsonFeature.properties[geometryLabel];
            }

            var properties = {};
            properties[Constants.INTERNAL_DATASET_FEATURE_ID] =
              geojsonFeature.properties[Constants.INTERNAL_DATASET_FEATURE_ID];

            properties[Constants.FILTERED_VALUE_PROPERTY_NAME] =
              filteredDataAsHash[name];

            properties[Constants.UNFILTERED_VALUE_PROPERTY_NAME] =
              unfilteredDataAsHash[name];

            properties[Constants.SELECTED_PROPERTY_NAME] =
              _.contains(activeFilterNames, name);

            properties[Constants.HUMAN_READABLE_PROPERTY_NAME] =
              humanReadableName;

            // Create a new object to get rid of superfluous shapefile-specific
            // fields coming out of the backend.
            return {
              geometry: geojsonFeature.geometry,
              properties: properties,
              type: geojsonFeature.type
            };
          }
        );

        return {
          crs: geojsonRegions.crs,
          features: newFeatures,
          type: geojsonRegions.type
        };
    }


    /**
     * Consolidates the given geojson data into one object.
     *
     * @param {Object} geojsonRegions - A geoJson-formatted object.
     * @param {Object[]} unfilteredData - An array of objects with 'name' and
     *   'value' keys (the unfiltered values of the data).
     * @param {Object[]} filteredData - An array of objects with 'name' and
     *   'value' keys (the filtered values of the data).
     * @param {Object[]} activeFilters - The active filters - each filter must
     *   have an 'operand' key.
     * @param {String} fieldName - The fieldName of the source column for this
     *   visualization.
     * @param {Object[]} columns - The array of columns for this dataset. Each
     *   column must have a 'name' key.
     *
     * @return {Object} (See mergeRegionAndAggregateData)
     */
    function aggregateGeoJsonData(
      geometryLabel,
      geojsonRegions,
      unfilteredData,
      filteredData,
      activeFilters,
      fieldName,
      columns) {

      var activeFilterNames = _.pluck(activeFilters, 'operand');

      var unfilteredDataAsHash = _.reduce(unfilteredData, function(acc, datum) {
        acc[datum.name] = datum.value;
        return acc;
      }, {});

      var filteredDataAsHash = _.reduce(filteredData, function(acc, datum) {
        acc[datum.name] = datum.value;
        return acc;
      }, {});

      // Extract the active column from the columns array by matching against
      // the card's "fieldName".
      var column = _.find(
        columns,
        function(column, candidateFieldName) {
          return candidateFieldName === fieldName;
        }
      );

      if (_.isEmpty(column)) {
        throw new Error('Could not match fieldName to human-readable column name.');
      }

      return mergeRegionAndAggregateData(
        geometryLabel,
        geojsonRegions,
        unfilteredDataAsHash,
        filteredDataAsHash,
        activeFilterNames
      );
    }

    return {
      extractShapeFileFromColumn: extractShapeFileFromColumn,
      extractSourceColumnFromColumn: extractSourceColumnFromColumn,
      aggregateGeoJsonData: aggregateGeoJsonData
    };
  }

  angular.
    module('dataCards.services').
      factory(
        'CardVisualizationChoroplethHelpers',
        CardVisualizationChoroplethHelpers
      );

})();
