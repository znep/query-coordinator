(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;
  var visualizations = socrata.visualizations;

  var TILESERVER_HOSTS = [
    'https://tileserver1.api.us.socrata.com',
    'https://tileserver2.api.us.socrata.com',
    'https://tileserver3.api.us.socrata.com',
    'https://tileserver4.api.us.socrata.com'
  ];
  var FEATURES_PER_TILE = 256 * 256;

  /**
   * Instantiates a Socrata FeatureMap Visualization from the
   * `socrata-visualizations` package.
   *
   * @param {String} domain - The domain against which to make the query.
   * @param {String} fourByFour - The uid of the dataset backing this
   *   visualization. The referenced dataset must be of the 'NBE' type.
   * @param {String} baseQuery - A valid SoQL query string.
   */

  $.fn.socrataFeatureMap = function(config) {

    this.destroySocrataFeatureMap = function() {
      visualization.destroy();
    }

    var $element = $(this);
    var datasetMetadata;

    // Geospace has knowledge of the extents of a column, which
    // we use to modify point data queries with a WITHIN_BOX clause.
    var geospaceDataProviderConfig = {
      domain: config.domain,
      fourByFour: config.fourByFour
    };
    var geospaceDataProvider = new socrata.visualizations.GeospaceDataProvider(
      geospaceDataProviderConfig
    );

    // Tileserver serves tile data using the standard {z}/{x}/{y} URL
    // format. It returns protocol buffers containing point offsets from
    // the tile origin (top left).
    var tileserverDataProviderConfig = {
      appToken: config.appToken,
      domain: config.domain,
      fourByFour: config.fourByFour,
      fieldName: config.fieldName,
      featuresPerTile: FEATURES_PER_TILE,
      tileserverHosts: TILESERVER_HOSTS,
    };
    var tileserverDataProvider = new socrata.visualizations.TileserverDataProvider(
      tileserverDataProviderConfig
    );

    // SoQL returns row results for display in the row inspector
    var soqlDataProviderConfig = {
      domain: config.domain,
      fourByFour: config.fourByFour
    };
    var soqlDataProvider = new socrata.visualizations.SoqlDataProvider(
      soqlDataProviderConfig
    );

    if (config.datasetMetadata) {

      // If the caller already has datasetMetadata, it can be passed through as
      // a configuration property.
      datasetMetadata = config.datasetMetadata;

    } else {

      // Otherwise, we also need to fetch the dataset metadata for the
      // specified dataset so that we can use its column definitions when
      // formatting data for the row inspector.
      var metadataProviderConfig = {
        domain: config.domain,
        fourByFour: config.fourByFour
      }
      var metadataProvider = new socrata.visualizations.MetadataProvider(
        metadataProviderConfig
      );

      // Make the dataset metadata request before initializing the visualization
      // in order to ensure that the column metadata is present before any of the
      // row inspector events (which expect it to be present) can be fired.
      //
      // If this request fails, we will fall back to listing columns
      // alphabetically instead of in the order in which they appear in the
      // dataset grid view.
      metadataProvider.
        getDatasetMetadata().
        then(
          handleDatasetMetadataRequestSuccess,
          handleDatasetMetadataRequestError
        ).catch(function(e) {
          logError(e);
        });
    }

    // The visualization itself handles rendering and interaction events.
    var visualizationConfig = {
      localization: config.localization,
      hover: config.hover,
      panAndZoom: config.panAndZoom
    };
    var visualization = new window.socrata.visualizations.FeatureMap(
      $element,
      visualizationConfig
    );

    // The visualizationRenderOptions may change in response to user actions
    // and are passed as an argument to every render call.
    var visualizationRenderOptions = {
      labelUnit: 'rows',
      baseLayer: {
        url: config.baseLayer,
        opacity: 0.15
      }
    };

    /**
     * Initial data requests to set up visualization state
     */

    // We query the extent of the features we are rendering in order to make
    // individual tile requests more performant (through the use of a
    // WITHIN_BOX query clause).
    geospaceDataProvider.
      getFeatureExtent(config.fieldName).
      then(
        handleFeatureExtentQuerySuccess,
        handleFeatureExtentQueryError
      ).catch(function(e) {
        logError(e);
      });

    initializeVisualization();

    /**
     * Events
     */

    $element.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);

    /**
     * Event handlers
     */

    function handleDatasetMetadataRequestSuccess(data) {

      datasetMetadata = data;
    }

    function handleDatasetMetadataRequestError() {

      // We can gracefully degrade here since the dataset metadata is only used
      // to provide formatting information for the row inspector.
      // In its absence, we simply won't format the row inspector data as
      // nicely.
    }

    function handleFeatureExtentQuerySuccess(response) {

      updateRenderOptionsBounds(response);
      renderIfReady();
    }

    function handleFeatureExtentQueryError() {

      renderError();
    }

    function handleRowInspectorQuery(event) {

      var payload = event.originalEvent.detail.data;

      var query = '$offset=0&$limit={0}&$order=distance_in_meters({1}, "POINT({2} {3})"){4}'.
        format(
          payload.rowCount,
          config.fieldName,
          payload.latLng.lng,
          payload.latLng.lat,
          generateWithinBoxClause(config.fieldName, payload.queryBounds)
        );

      function generateWithinBoxClause(fieldName, bounds) {

        return '&$where=within_box({0}, {1}, {2})'.format(
          fieldName,
          '{0}, {1}'.format(bounds.northeast.lat, bounds.northeast.lng),
          '{0}, {1}'.format(bounds.southwest.lat, bounds.southwest.lng)
        );
      }

      soqlDataProvider.
        getRows(query).
        then(
          handleRowInspectorQuerySuccess,
          handleRowInspectorQueryError
        ).catch(function(e) {
          logError(e);
        });

      event.stopPropagation();
    };

    function handleRowInspectorQuerySuccess(data) {

      var rowInspectorPayload = {
        data: formatRowInspectorData(datasetMetadata, data),
        error: false,
        message: null
      }

      emitRowInspectorUpdateEvent(rowInspectorPayload);
    }

    function handleRowInspectorQueryError() {

      var rowInspectorPayload = {
        data: null,        
        error: true,
        message: config.localization.ROW_INSPECTOR_ROW_DATA_QUERY_FAILED
      }

      emitRowInspectorUpdateEvent(rowInspectorPayload);
    }

    /**
     * Helper functions
     */

    function initializeVisualization() {

      // For now, we don't need to use any where clause but the default
      // one, so we just inline the call to
      // updateRenderOptionsVectorTileGetter.
      updateRenderOptionsVectorTileGetter(config.baseWhereClause, config.useOriginHost);
      renderIfReady();
    }

    function updateRenderOptionsBounds(extent) {

      var southWest = L.latLng(extent.southwest[0], extent.southwest[1]);
      var northEast = L.latLng(extent.northeast[0], extent.northeast[1]);

      visualizationRenderOptions.bounds = L.latLngBounds(southWest, northEast);
    }

    function updateRenderOptionsVectorTileGetter(whereClause, useOriginHost) {

      useOriginHost = useOriginHost || false;

      visualizationRenderOptions.vectorTileGetter = tileserverDataProvider.buildTileGetter(
        whereClause,
        useOriginHost
      );
    }

    function renderIfReady() {

      var hasBounds = visualizationRenderOptions.hasOwnProperty('bounds');
      var hasTileGetter = visualizationRenderOptions.hasOwnProperty('vectorTileGetter');

      if (hasBounds && hasTileGetter) {

        visualization.render(visualizationRenderOptions);
      }
    }

    function renderError() {
      visualization.renderError();
    }

    function formatRowInspectorData(datasetMetadata, data) {

      // Each of our rows will be mapped to 'formattedRowData', an array of
      // objects.  Each row corresponds to a single page in the flannel.
      return data.rows.map(
        function(row, index) {

          // If the dataset metadata request fails, then datasetMetadata will
          // be undefined. In this case, we should fall back to sorting
          // alphabetically instead of sorting by the order in which the
          // columns have been arranged in the dataset view.
          if (datasetMetadata) {

            return orderRowDataByColumnIndex(
              datasetMetadata.columns,
              data.columns,
              row
            );

          } else {

            return orderRowDataAlphabetically(
              data.columns,
              row
            );
          }
        }
      );
    }

    function orderRowDataByColumnIndex(datasetMetadataColumns, columnNames, row) {

      var formattedRowData = [];

      // This method takes in the column name of the subColumn
      // (e.g. Crime Location (address)) and the parentColumnName of that
      // subColumn (e.g. Crime Location) and returns the subColumn string
      // within the parentheses (address).
      function extractSubColumnName(existingName, parentColumnName) {

        var subColumnMatch = existingName.match(/\(([^()]+)\)$/);

        if (subColumnMatch.length >= 2) {

          var existingNameSuffix = subColumnMatch[1];

          if (_.contains(['address', 'city', 'state', 'zip'], existingNameSuffix)) {
            return existingNameSuffix;
          }
        }

        return existingName.replace('{0} '.format(parentColumnName), '');
      }

      columnNames.forEach(
        function(columnName) {

          if (datasetMetadataColumns.hasOwnProperty(columnName)) {

            var columnMetadata = datasetMetadataColumns[columnName];
            var columnValue = row[columnNames.indexOf(columnName)];

            // If we're formatting a sub-column, first find the parent
            // column name and position, and then format accordingly.
            // Otherwise, just format the normal column.
            //
            // NOTE: We can rely upon sub-columns being added after their
            // corresponding parent columns.
            if (columnMetadata.isSubcolumn) {

              // For example, if column name is 'crime_location_address'
              // or 'crime_location_zip', the parentColumnName would be
              // 'crime_location'.
              var parentColumnName = columnName.slice(0, columnName.lastIndexOf('_'));

              if (datasetMetadataColumns.hasOwnProperty(parentColumnName)) {

                var parentPosition = datasetMetadataColumns[parentColumnName].position;
                var subColumnName = extractSubColumnName(columnName, parentColumnName);
                var subColumnDatum = {
                  column: subColumnName,
                  value: _.isObject(columnValue) ? [columnValue] : columnValue,
                  format: columnMetadata.format,
                  physicalDatatype: columnMetadata.physicalDatatype
                };

                formattedRowData[parentPosition].value.push(subColumnDatum);
              }

            } else {

              // If the column value is an object (e.g. a coordinate point),
              // we should format it slightly differently.
              formattedRowData[columnMetadata.position] = {
                column: columnName,
                value: _.isObject(columnValue) ? [columnValue] : columnValue,
                format: _.isObject(columnValue) ? undefined : columnMetadata.format,
                physicalDatatype: columnMetadata.physicalDatatype
              };

            }
          }
        }
      );

      // Since we are updating individual indices of formattedRowData
      // out of order, it is possible that we may not update all of them.
      // Un-updated indices will default to undefined, and the following
      // filter will collapse the array down to only defined values.
      return formattedRowData.
        filter(
          function (datum) {
            return !_.isUndefined(datum)
          }
        );
    }

    function orderRowDataAlphabetically(columnNames, row) {

      var formattedRowData = [];
      var sortedColumnNames = columnNames.sort();

      sortedColumnNames.
        forEach(
        function(columnName, index) {

          var originalColumnIndex = columnNames.indexOf(columnName);
          var columnValue = row[originalColumnIndex];

          var rowDatum = {
            column: columnName,
            value: _.isObject(columnValue) ? [columnValue] : columnValue,
            format: undefined,
            physicalDatatype: undefined
          };

          formattedRowData.push(rowDatum);
        }
      );

      return formattedRowData;
    }

    function emitRowInspectorUpdateEvent(payload) {

      $element[0].dispatchEvent(
        new root.CustomEvent(
          'SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE',
          {
            detail: {
              data: payload
            },
            bubbles: true
          }
        )
      );
    }

    function logError(e) {

      if (console && console.error) {
        console.error(e);
      }
    }

    return this;
  };
}(jQuery, window));
