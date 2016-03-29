module.exports = function CardVisualizationChoroplethHelpers(Constants, $log) {

  /**
   * Extracts the shapefile from a dataset metadata column.
   *
   * @param {Object} column
   *
   * @return {String} shapefile
   */
  function extractShapeFileFromColumn(column) {

    function reportMissingProperty(property) {
      $log.error(
        `Could not determine column shapefile: "${property}" not present on column "${column.name}".`
      );
    }

    var shapefile = null;

    if (!column.hasOwnProperty('computationStrategy')) {
      reportMissingProperty('computationStrategy');
    } else if (!column.computationStrategy.hasOwnProperty('parameters')) {
      reportMissingProperty('parameters');
    } else if (!column.computationStrategy.parameters.hasOwnProperty('region')) {
      reportMissingProperty('region');
    } else {
      shapefile = column.computationStrategy.parameters.region.replace(/_/, '');
    }

    return shapefile;

  }

  /**
   * Consolidates the given geojson data into one object.
   *
   * @param {String} geometryLabel - The name of the property that should be
   *   used as the 'human-readable' name for a region.
   * @param {String} primaryKey - Name of the property to be used as the primary key
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
    regionMetadata,
    geojsonRegions,
    unfilteredData,
    filteredData,
    activeFilters,
    fieldName,
    columns) {

    var primaryKey = regionMetadata.featurePk;
    var geometryLabel = regionMetadata.geometryLabel;

    var primaryKeyPath = `properties.${primaryKey}`;
    var geometryLabelPath = `properties.${geometryLabel}`;

    var activeFilterNames = _.pluck(activeFilters, 'operand');

    var reducer = function(acc, datum) {
      acc[datum.name] = datum.value;
      return acc;
    };

    var unfilteredDataAsHash = _.reduce(unfilteredData, reducer, {});
    var filteredDataAsHash = _.reduce(filteredData, reducer, {});

    // Extract the active column from the columns array by matching against
    // the card's "fieldName".
    if (!_.isObject(columns[fieldName])) {
      var errorMessage = `Could not match fieldName ${fieldName} to human-readable column name in ${columns}.`;
      throw new Error(errorMessage);
    }

    var newFeatures = [];

    if (geojsonRegions.features) {
      newFeatures = _.map(_.filter(geojsonRegions.features, primaryKeyPath), function(geojsonFeature) {
        var name = _.get(geojsonFeature, primaryKeyPath);
        var humanReadableName = _.get(geojsonFeature, geometryLabelPath, '');

        var properties = {};
        properties[primaryKey] = name;

        properties[Constants.FILTERED_VALUE_PROPERTY_NAME] =
          filteredDataAsHash[name];

        properties[Constants.UNFILTERED_VALUE_PROPERTY_NAME] =
          unfilteredDataAsHash[name];

        properties[Constants.SELECTED_PROPERTY_NAME] = _.contains(activeFilterNames, name);

        properties[Constants.HUMAN_READABLE_PROPERTY_NAME] =
          humanReadableName;

        // Create a new object to get rid of superfluous shapefile-specific
        // fields coming out of the backend.
        return {
          geometry: geojsonFeature.geometry,
          properties: properties,
          type: geojsonFeature.type
        };
      });
    }

    return {
      crs: geojsonRegions.crs,
      features: newFeatures,
      type: geojsonRegions.type
    };
  }

  function computedColumnNameToShapefileId(computedColumnName) {
    if (!_.isString(computedColumnName)) { return; }
    return computedColumnName.replace(/.*(\w{4})_(\w{4})$/, '$1-$2');
  }

  return {
    computedColumnNameToShapefileId: computedColumnNameToShapefileId,
    extractShapeFileFromColumn: extractShapeFileFromColumn,
    aggregateGeoJsonData: aggregateGeoJsonData
  };
};
