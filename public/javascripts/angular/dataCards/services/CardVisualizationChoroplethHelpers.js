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
     * Extracts the geometryLabel from a dataset metadata column.
     *
     * @param {Object} column
     *
     * @return {String} geometryLabel
     */
    function extractGeometryLabelFromColumn(column) {

      function reportMissingProperty(property) {
        $log.warn(
          'Could not determine column geometryLabel: "{0}" not present on column "{1}".'.
          format(property, column.name)
        );
      }

      var geometryLabel = null;

      if (!column.hasOwnProperty('computationStrategy')) {
        reportMissingProperty('computationStrategy');
      } else if (!column.computationStrategy.hasOwnProperty('parameters')) {
        reportMissingProperty('parameters');
      } else if (!column.computationStrategy.parameters.hasOwnProperty('geometryLabel')) {
        reportMissingProperty('geometryLabel');
      } else {
        geometryLabel = column.computationStrategy.parameters.geometryLabel;
      }

      return geometryLabel;

    }

    /**
     * Attempts to determine a geometryLabel based on a pre-defined mapping
     * of shapeFile ids to geometryLabels.
     *
     * @param {Object} shapeFile
     *
     * @return {String} geometryLabel
     */
    function getGeometryLabelByShapeFile(shapeFile) {

      // This mapping provides the geometryLabel (formerly shapefileHumanReadablePropertyName)
      // for a given shapefile 4x4. This is a temporary measure until this information can be
      // provided by the metadata service.
      var geometryLabelMapping = {
        '7vkw-k8eh': 'community',
        'snuk-a5kv': 'ward',
        '99f5-m626': 'zip',
        'qttw-wpd6': 'name',
        'ernj-gade': 'supdist',
        '9ax2-xhmg': 'district',
        'e2nj-t6rn': 'name',
        'a9zv-gp2q': 'zcta5ce10',
        '7a5b-8kcq': 'borocd',
        '9qyy-j3br': 'schooldist',
        'fvid-vsfz': 'countdist',
        'szt7-kj5n': 'geoid10',
        '9gf2-g78j': 'name',
        'afrk-7ibz': 'name',
        '7mve-5gn9': 'dist_numc',
        '82gf-y944': 'name',
        '5tni-guuj': 'name',
        'pqdv-qiia': 'name',
        '5trx-7ni6': 'name',
        'nmuc-gpu5': 'name',
        '8fjz-g95m': 'tract',
        '2q28-58m6': 'tractce',
        '86dh-mgvd': 'geoid10',
        '8thk-xhvj': 'name',
        '35kt-7gyk': 'district',
        'mdjy-33rn': 'countyname',
        '98hf-33cq': 'zip',
        'fbzh-zpfr': 'council',
        'p3v4-2swa': 'name',
        'cwdz-i4bh': 'name',
        'tgu8-ecbp': 'geoid10',
        'uu7q-dmf8': 'district',
        'ptc7-ykax': 'nhood',
        'ej5w-qt6t': 'objectid',
        'cf84-d7ef': 'supdist',
        '9t2m-phkm': 'district',
        'my34-vmp8': 'countyname',
        'w4hf-t6bp': 'zip',
        'tx5f-5em3': 'council',
        'kbsp-ykn9': 'name',
        'rbt8-3x7n': 'name',
        'd7bw-bq6x': 'geoid10',
        'p5aj-wyqh': 'district',
        'b2j2-ahrz': 'nhood',
        'yftq-j783': 'objectid',
        'rxqg-mtj9': 'supdist',
        'hak8-5bvb': 'coundist',
        'swkg-bavi': 'zone_type',
        'rffn-qbt6': 'name',
        'rcj3-ccgu': 'geoid10',
        'ueqj-g33x': 'lname',
        'asue-2ipu': 'district_1',
        'cjq3-kq3a': 'geoid10',
        'buyp-4dp9': 'geoid10',
        '4rat-gsiv': 'geoid10',
        'ndi2-bfht': 'district',
        'u9vc-vmbc': 'district',
        '28yu-qtqf': 'geoid10',
        'ce8n-ahaq': 'zone_type',
        'xv2v-ia46': 'name',
        'bwdd-ss8w': 'geoid10',
        'w7nm-sadn': 'lname',
        'bf3n-hej2': 'district_1',
        'wrxk-qft3': 'geoid10',
        'nr9s-8m49': 'geoid10',
        '6t63-sezg': 'geoid10',
        '8f9p-hupj': 'district',
        'c62z-keqd': 'district',
        'tbvr-2deq': 'geoid10'
      };

      if (shapeFile && geometryLabelMapping.hasOwnProperty(shapeFile)) {
        return geometryLabelMapping[shapeFile];
      }

      if (ServerConfig.metadataMigration.shouldConsumeComputationStrategy()) {
        $log.warn('Unable to determine geometryLabel in fallback for shapeFile: "{0}".'.format(shapeFile));
      } else {
        $log.warn('Unable to determine geometryLabel for shapeFile: "{0}".'.format(shapeFile));
      }

      return null;

    }

    function mergeRegionAndAggregateData(
      activeFilterNames,
      geojsonRegions,
      unfilteredDataAsHash,
      filteredDataAsHash,
      geometryLabel) {

        var newFeatures = geojsonRegions.features.filter(function(geojsonFeature) {
          return geojsonFeature.properties.hasOwnProperty(Constants['INTERNAL_DATASET_FEATURE_ID']) &&
                 geojsonFeature.properties[Constants['INTERNAL_DATASET_FEATURE_ID']];
        }).map(function(geojsonFeature) {

          var name = geojsonFeature.properties[Constants['INTERNAL_DATASET_FEATURE_ID']];
          var humanReadableName = '';

          if (_.isString(geometryLabel) && geojsonFeature.properties.hasOwnProperty(geometryLabel)) {
            humanReadableName = geojsonFeature.properties[geometryLabel];
          }

          var properties = {};
          properties[Constants['INTERNAL_DATASET_FEATURE_ID']] = geojsonFeature.properties[Constants['INTERNAL_DATASET_FEATURE_ID']];
          properties[Constants['FILTERED_VALUE_PROPERTY_NAME']] = filteredDataAsHash[name];
          properties[Constants['UNFILTERED_VALUE_PROPERTY_NAME']] = unfilteredDataAsHash[name];
          properties[Constants['SELECTED_PROPERTY_NAME']] = _.contains(activeFilterNames, name);
          properties[Constants['HUMAN_READABLE_PROPERTY_NAME']] = humanReadableName;

          // Create a new object to get rid of superfluous shapefile-specific
          // fields coming out of the backend.
          return {
            geometry: geojsonFeature.geometry,
            properties: properties,
            type: geojsonFeature.type
          };
        });

        return {
          crs: geojsonRegions.crs,
          features: newFeatures,
          type: geojsonRegions.type
        };
    }


    /**
     * Consolidates the given geojson data into one object.
     *
     * @param {Object} geojsonRegions A geoJson-formatted object.
     * @param {Object[]} unfilteredData An array of objects with 'name' and 'value' keys - the
     *   unfiltered values of the data.
     * @param {Object[]} filteredData An array of objects with 'name' and 'value' keys - the data,
     *   after any active filters have been applied.
     * @param {Object[]} activeFilters The active filters - each filter must have an 'operand' key.
     * @param {String} fieldName the active column's name.
     * @param {Object[]} columns the array of columns for this dataset. Each column must have a
     *   'name' key.
     *
     * @return {Object} with properties
     *   @property {TODO} crs the geojsonRegion's crs.
     *   @property {Object[]} features an array of object with properties:
     *     @property {Object} geometry the geoJson's geometry.
     *     @property {Object} properties contains both the filtered and unfiltered values for this
     *       feature.
     *     @property {TODO} type this feature's geojson type.
     *   @property {TODO} type the geojsonRegion's type.
     */
    function aggregateGeoJsonData(geojsonRegions, unfilteredData, filteredData, activeFilters, fieldName, columns) {

      var activeFilterNames = _.pluck(activeFilters, 'operand');
      var geometryLabel = null;

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
        function(column, candidateFieldName) { return candidateFieldName === fieldName; }
      );

      if (_.isEmpty(column)) {
      debugger
        throw new Error('Could not match fieldName to human-readable column name.');
      }

      if (ServerConfig.metadataMigration.shouldConsumeComputationStrategy()) {
        geometryLabel = extractGeometryLabelFromColumn(column);
        if (geometryLabel === null) {
          geometryLabel = getGeometryLabelByShapeFile(column.shapefile);
        }
      } else {
        geometryLabel = getGeometryLabelByShapeFile(column.shapefile);
      }

      return mergeRegionAndAggregateData(
        activeFilterNames,
        geojsonRegions,
        unfilteredDataAsHash,
        filteredDataAsHash,
        geometryLabel
      );
    }

    return {
      extractShapeFileFromColumn: extractShapeFileFromColumn,
      extractGeometryLabelFromColumn: extractGeometryLabelFromColumn,
      aggregateGeoJsonData: aggregateGeoJsonData
    };
  }

  angular.
    module('dataCards.services').
      factory('CardVisualizationChoroplethHelpers', CardVisualizationChoroplethHelpers);

})();
