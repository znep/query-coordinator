var _ = require('lodash');
var $ = require('jquery');
var utils = require('socrata-utils');
var FeatureMap = require('./views/FeatureMap');
var GeospaceDataProvider = require('./dataProviders/GeospaceDataProvider');
var TileserverDataProvider = require('./dataProviders/TileserverDataProvider');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var MetadataProvider = require('./dataProviders/MetadataProvider');

var DEFAULT_TILESERVER_HOSTS = [
  'https://tileserver1.api.us.socrata.com',
  'https://tileserver2.api.us.socrata.com',
  'https://tileserver3.api.us.socrata.com',
  'https://tileserver4.api.us.socrata.com'
];
var DEFAULT_FEATURES_PER_TILE = 256 * 256;
// known in data lens as "simple blue"
var DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
var DEFAULT_BASE_LAYER_OPACITY = 0.42;
var WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata FeatureMap Visualization from the
 * `socrata-visualizations` package.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataFeatureMap = function(vif) {

  utils.assertHasProperties(
    vif,
    'columnName',
    'configuration',
    'datasetUid',
    'domain',
    'unit'
  );

  utils.assertHasProperties(
    vif.unit,
    'one',
    'other'
  );

  utils.assertHasProperties(
    vif.configuration,
    'localization'
  );

  utils.assertHasProperties(
    vif.configuration.localization,
    'FLYOUT_FILTER_NOTICE',
    'FLYOUT_FILTER_OR_ZOOM_NOTICE',
    'FLYOUT_DENSE_DATA_NOTICE',
    'FLYOUT_CLICK_TO_INSPECT_NOTICE',
    'FLYOUT_CLICK_TO_LOCATE_USER_TITLE',
    'FLYOUT_CLICK_TO_LOCATE_USER_NOTICE',
    'FLYOUT_LOCATING_USER_TITLE',
    'FLYOUT_LOCATE_USER_ERROR_TITLE',
    'FLYOUT_LOCATE_USER_ERROR_NOTICE',
    'FLYOUT_PAN_ZOOM_DISABLED_WARNING_TITLE',
    'ROW_INSPECTOR_ROW_DATA_QUERY_FAILED',
    'USER_CURRENT_POSITION'
  );

  var $element = $(this);
  var datasetMetadata;

  // Geospace has knowledge of the extents of a column, which
  // we use to modify point data queries with a WITHIN_BOX clause.
  var geospaceDataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.datasetUid
  };
  var geospaceDataProvider = new GeospaceDataProvider(
    geospaceDataProviderConfig
  );

  // Tileserver serves tile data using the standard {z}/{x}/{y} URL
  // format. It returns protocol buffers containing point offsets from
  // the tile origin (top left).
  var tileserverDataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.datasetUid,
    columnName: vif.columnName,
    featuresPerTile: DEFAULT_FEATURES_PER_TILE,
    tileserverHosts: vif.configuration.tileserverHosts || DEFAULT_TILESERVER_HOSTS
  };
  var tileserverDataProvider = new TileserverDataProvider(
    tileserverDataProviderConfig
  );

  // SoQL returns row results for display in the row inspector
  var soqlDataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.datasetUid
  };
  var soqlDataProvider = new SoqlDataProvider(
    soqlDataProviderConfig
  );

  if (vif.configuration.datasetMetadata) {

    // If the caller already has datasetMetadata, it can be passed through as
    // a configuration property.
    datasetMetadata = vif.configuration.datasetMetadata;

  } else {

    // Otherwise, we also need to fetch the dataset metadata for the
    // specified dataset so that we can use its column definitions when
    // formatting data for the row inspector.
    var metadataProviderConfig = {
      domain: vif.domain,
      datasetUid: vif.datasetUid
    };
    var metadataProvider = new MetadataProvider(
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
      )['catch'](function(e) {
        logError(e);
      });
  }

  var visualization = new FeatureMap(
    $element,
    vif
  );
  // The visualizationRenderOptions may change in response to user actions
  // and are passed as an argument to every render call.
  var visualizationRenderOptions = {
    baseLayer: {
      url: vif.configuration.baseLayerUrl || DEFAULT_BASE_LAYER_URL,
      opacity: vif.configuration.baseLayerOpacity || DEFAULT_BASE_LAYER_OPACITY
    }
  };
  var rerenderOnResizeTimeout;

  /**
   * Initial data requests to set up visualization state
   */

  // We query the extent of the features we are rendering in order to make
  // individual tile requests more performant (through the use of a
  // WITHIN_BOX query clause).
  geospaceDataProvider.
    getFeatureExtent(vif.columnName).
    then(
      handleFeatureExtentQuerySuccess,
      handleFeatureExtentQueryError
    )['catch'](function(e) {
      logError(e);
    });

  initializeVisualization();

  /**
   * Events
   */

  function attachEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      clearTimeout(rerenderOnResizeTimeout);
      visualization.destroy();
      detachEvents();
    });

    $element.on('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleVisualizationFlyoutShow);
    $element.on('SOCRATA_VISUALIZATION_FLYOUT_HIDE', handleVisualizationFlyoutHide);
    $element.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);
    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
  }

  function detachEvents() {

    $element.off('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleVisualizationFlyoutShow);
    $element.off('SOCRATA_VISUALIZATION_FLYOUT_HIDE', handleVisualizationFlyoutHide);
    $element.off('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);
    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
  }

  /**
   * Event handlers
   */

  function _handleWindowResize() {

    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      renderIfReady,
      // Add some jitter in order to make sure multiple visualizations are
      // unlikely to all attempt to rerender themselves at the exact same
      // moment.
      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
    );
  }

  function handleDatasetMetadataRequestSuccess(data) {

    datasetMetadata = data;
  }

  function handleDatasetMetadataRequestError(error) {

    // The only consumer of dataset metadata is the row inspector flyout.
    // If the request fails, we won't show the row inspector on click.
    console.error('Failed to fetch dataset metadata: {0}'.format(error));
  }

  function handleFeatureExtentQuerySuccess(response) {
    updateRenderOptionsBounds(response);
    renderIfReady();
  }

  function handleFeatureExtentQueryError() {
    renderError();
  }

  function handleVisualizationFlyoutShow(event) {
    var payload = event.originalEvent.detail;
    var $flyoutContent = null;
    var $flyoutTitle;
    var $flyoutNotice;
    var flyoutPayload;

    event.stopPropagation();

    if (payload !== null) {

      $flyoutContent = $(document.createDocumentFragment());

      // 'Datum Title'
      $flyoutTitle = $(
        '<div>',
        {
          'class': 'socrata-flyout-title'
        }
      ).text(payload.title);

      $flyoutContent.append($flyoutTitle);

      if (payload.hasOwnProperty('notice') && payload.notice) {

        $flyoutNotice = $(
          '<div>',
          {
            'class': 'socrata-flyout-notice'
          }
        ).text(payload.notice);

        $flyoutContent.append($flyoutNotice);
      }

      if (payload.hasOwnProperty('flyoutOffset') && payload.flyoutOffset) {

        flyoutPayload = {
          flyoutOffset: payload.flyoutOffset,
          content: $flyoutContent,
          rightSideHint: false,
          belowTarget: false
        };

      } else {

        flyoutPayload = {
          element: payload.element,
          content: $flyoutContent,
          rightSideHint: false,
          belowTarget: false
        };

      }

      $element[0].dispatchEvent(
        new CustomEvent(
          'SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT',
          {
            detail: flyoutPayload,
            bubbles: true
          }
        )
      );
    }
  }

  function handleVisualizationFlyoutHide() {
    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_FEATURE_MAP_FLYOUT',
        {
          detail: null,
          bubbles: true
        }
      )
    );
  }

  function handleRowInspectorQuery(event) {
    if (!datasetMetadata) {
      // Dataset metadata request either failed or isn't ready yet.
      // Pop up an error.
      handleRowInspectorQueryError();
      return;
    }

    var payload = event.originalEvent.detail;

    var query = '$offset=0&$limit={0}&$order=distance_in_meters({1}, "POINT({2} {3})"){4}'.
      format(
        payload.rowCount,
        vif.columnName,
        payload.latLng.lng,
        payload.latLng.lat,
        generateWithinBoxClause(vif.columnName, payload.queryBounds)
      );

    var displayableColumns = metadataProvider.getDisplayableColumns(datasetMetadata);

    function generateWithinBoxClause(columnName, bounds) {

      return '&$where=within_box({0}, {1}, {2})'.format(
        columnName,
        '{0}, {1}'.format(bounds.northeast.lat, bounds.northeast.lng),
        '{0}, {1}'.format(bounds.southwest.lat, bounds.southwest.lng)
      );
    }

    soqlDataProvider.
      getRows(_.pluck(displayableColumns, 'fieldName'), query).
      then(
        handleRowInspectorQuerySuccess,
        handleRowInspectorQueryError
      )['catch'](function(e) {
        logError(e);
      });

    event.stopPropagation();
  }

  function handleRowInspectorQuerySuccess(data) {

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE',
        {
          detail: {
            data: formatRowInspectorData(datasetMetadata, data),
            error: false,
            message: null
          },
          bubbles: true
        }
      )
    );
  }

  function handleRowInspectorQueryError() {

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE',
        {
          detail: {
            data: null,
            error: true,
            message: vif.configuration.localization.ROW_INSPECTOR_ROW_DATA_QUERY_FAILED
          },
          bubbles: true
        }
      )
    );
  }

  /**
   * Helper functions
   */

  function initializeVisualization() {

    attachEvents();

    // For now, we don't need to use any where clause but the default
    // one, so we just inline the call to
    // updateRenderOptionsVectorTileGetter.
    updateRenderOptionsVectorTileGetter(soqlDataProvider.buildBaseQuery(vif.filters), vif.configuration.useOriginHost);
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
      function(row) {
        return orderRowDataByColumnIndex(
          datasetMetadata.columns,
          data.columns,
          row
        );
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
        var columnMetadata = _.find(datasetMetadataColumns, {fieldName: columnName});

        if (_.isPlainObject(columnMetadata)) {

          var columnValue = row[columnNames.indexOf(columnName)];
          columnValue = _.isUndefined(columnValue) ? '' : columnValue;

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
            var parentColumnMetadata = _.find(datasetMetadataColumns, {fieldName: parentColumnName});

            if (_.isPlainObject(parentColumnMetadata)) {

              var parentPosition = parentColumnMetadata.position;
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
        function(datum) {
          return !_.isUndefined(datum);
        }
      );
  }

  function logError(e) {

    if (console && console.error) {
      console.error(e);
    }
  }

  return this;
};

module.exports = $.fn.socrataFeatureMap;
