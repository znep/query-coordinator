var _ = require('lodash');
var $ = require('jquery');
var L = require('leaflet');
var utils = require('common/js_utils');
var FeatureMap = require('./views/FeatureMap');
var GeospaceDataProvider = require('./dataProviders/GeospaceDataProvider');
var TileserverDataProvider = require('./dataProviders/TileserverDataProvider');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');
var MetadataProvider = require('./dataProviders/MetadataProvider');
var DataTypeFormatter = require('./views/DataTypeFormatter');

var DEFAULT_FEATURES_PER_TILE = 256 * 256;
// known in data lens as "simple blue"
var DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
var DEFAULT_BASE_LAYER_OPACITY = 0.42;
var WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata FeatureMap Visualization.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataFeatureMap = function(vif) {

  utils.assert(
    _.isPlainObject(vif),
    'You must pass in a valid VIF to use socrataFeatureMap'
  );

  utils.assertHasProperties(
    vif,
    'configuration.localization',
    'columnName',
    'datasetUid',
    'domain',
    'unit.one',
    'unit.other'
  );

  utils.assertIsOneOfTypes(vif.columnName, 'string');
  utils.assertIsOneOfTypes(vif.domain, 'string');
  utils.assertIsOneOfTypes(vif.datasetUid, 'string');
  utils.assertIsOneOfTypes(vif.unit.one, 'string');
  utils.assertIsOneOfTypes(vif.unit.other, 'string');

  utils.assertHasProperties(
    vif.configuration.localization,
    'flyout_filter_notice',
    'flyout_filter_or_zoom_notice',
    'flyout_dense_data_notice',
    'flyout_click_to_inspect_notice',
    'flyout_click_to_locate_user_title',
    'flyout_click_to_locate_user_notice',
    'flyout_locating_user_title',
    'flyout_locate_user_error_title',
    'flyout_locate_user_error_notice',
    'flyout_pan_zoom_disabled_warning_title',
    'row_inspector_row_data_query_failed',
    'user_current_position',
    'column_incompatibility_error',
    'feature_extent_query_error'
  );

  var $element = $(this);
  var datasetMetadata;

  var columnName = _.get(vif, 'columnName');
  var domain = _.get(vif, 'domain');
  var datasetUid = _.get(vif, 'datasetUid');

  // Geospace has knowledge of the extents of a column, which
  // we use to modify point data queries with a WITHIN_BOX clause.
  var geospaceDataProviderConfig = {
    domain: domain,
    datasetUid: datasetUid
  };
  var geospaceDataProvider = new GeospaceDataProvider(
    geospaceDataProviderConfig
  );

  // Tileserver serves tile data using the standard {z}/{x}/{y} URL
  // format. It returns protocol buffers containing point offsets from
  // the tile origin (top left).
  var tileserverDataProviderConfig = {
    domain: domain,
    datasetUid: datasetUid,
    columnName: columnName,
    featuresPerTile: DEFAULT_FEATURES_PER_TILE
  };
  var tileserverDataProvider = new TileserverDataProvider(
    tileserverDataProviderConfig
  );

  // SoQL returns row results for display in the row inspector
  var soqlDataProviderConfig = {
    domain: domain,
    datasetUid: datasetUid
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
      domain: domain,
      datasetUid: datasetUid
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
      ).catch(function(e) {
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
    getFeatureExtent(columnName).
    then(
      handleFeatureExtentQuerySuccess,
      handleFeatureExtentQueryError.bind(this)
    ).catch(function(e) {
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
    $element.on('SOCRATA_VISUALIZATION_FEATURE_MAP_CENTER_AND_ZOOM_CHANGE', handleMapCenterAndZoomChange);
    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
  }

  function detachEvents() {

    $element.off('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleVisualizationFlyoutShow);
    $element.off('SOCRATA_VISUALIZATION_FLYOUT_HIDE', handleVisualizationFlyoutHide);
    $element.off('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);
    $element.off('SOCRATA_VISUALIZATION_FEATURE_MAP_CENTER_AND_ZOOM_CHANGE', handleMapCenterAndZoomChange);
    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
  }

  /**
   * Event handlers
   */

  function _handleRenderVif(event) {
    var newVif = event.originalEvent.detail;

    updateRenderOptionsVectorTileGetter(SoqlHelpers.whereClauseNotFilteringOwnColumn(newVif, 0));

    renderIfReady();
  }

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

  function handleFeatureExtentQueryError(error) {
    var message;
    var errorCode = _.get(error, 'soqlError.errorCode');

    if (errorCode === 'query.soql.type-mismatch') {
      message = vif.configuration.localization.column_incompatibility_error;
    } else {
      message = vif.configuration.localization.feature_extent_query_error;
    }

    renderError(message);
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
          dark: true,
          rightSideHint: false,
          belowTarget: false
        };

      } else {

        flyoutPayload = {
          element: payload.element,
          content: $flyoutContent,
          dark: true,
          rightSideHint: false,
          belowTarget: false
        };

      }

      $element[0].dispatchEvent(
        new CustomEvent(
          'SOCRATA_VISUALIZATION_FLYOUT',
          {
            detail: flyoutPayload,
            bubbles: true
          }
        )
      );

      // TODO: Remove the dispatch of the '...FEATURE_MAP_FLYOUT' event once
      // DataLens is using the new standardized 'SOCRATA_VISUALIZATION_FLYOUT'
      // event.
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
        'SOCRATA_VISUALIZATION_FLYOUT',
        {
          detail: null,
          bubbles: true
        }
      )
    );

    // TODO: Remove the dispatch of the '...FEATURE_MAP_FLYOUT' event once
    // DataLens is using the new standardized 'SOCRATA_VISUALIZATION_FLYOUT'
    // event.
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

    var whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0);
    var query = '$offset=0&$limit={0}&$order=distance_in_meters({1}, "POINT({2} {3})"){4}{5}'.
      format(
        payload.rowCount,
        columnName,
        payload.latLng.lng,
        payload.latLng.lat,
        generateWithinBoxClause(columnName, payload.queryBounds),
        whereClause ? ' AND ' + whereClause : ''
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
      getRows(_.map(displayableColumns, 'fieldName'), query).
      then(
        handleRowInspectorQuerySuccess,
        handleRowInspectorQueryError
      ).catch(function(e) {
        logError(e);
      });

    event.stopPropagation();
  }

  function handleRowInspectorQuerySuccess(data) {
    var getPageTitle = function(page) {
      return _.find(page, {column: vif.configuration.rowInspectorTitleColumnName}).value;
    };
    var formattedData = formatRowInspectorData(datasetMetadata, data);
    var titles = vif.configuration.rowInspectorTitleColumnName ? _.map(formattedData, getPageTitle) : [];

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE',
        {
          detail: {
            data: formattedData,
            titles: titles,
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

  function handleMapCenterAndZoomChange(event) {

    event.originalEvent.stopPropagation();

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED',
        {
          detail: event.originalEvent.detail,
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

    updateRenderOptionsVectorTileGetter(SoqlHelpers.whereClauseNotFilteringOwnColumn(vif, 0));

    renderIfReady();
  }

  function updateRenderOptionsBounds(extent) {

    var southWest = L.latLng(extent.southwest[0], extent.southwest[1]);
    var northEast = L.latLng(extent.northeast[0], extent.northeast[1]);

    visualizationRenderOptions.bounds = L.latLngBounds(southWest, northEast);
  }

  function updateRenderOptionsVectorTileGetter(whereClause) {

    visualizationRenderOptions.vectorTileGetter = tileserverDataProvider.buildTileGetter(
      whereClause
    );
  }

  function renderIfReady() {

    var hasBounds = visualizationRenderOptions.hasOwnProperty('bounds');
    var hasTileGetter = visualizationRenderOptions.hasOwnProperty('vectorTileGetter');

    if (hasBounds && hasTileGetter) {

      visualization.render(visualizationRenderOptions);
    }
  }

  function renderError(message) {
    visualization.renderError(message);
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

        if (_.includes(['address', 'city', 'state', 'zip'], existingNameSuffix)) {
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
              value: DataTypeFormatter.renderCellHTML(columnValue, columnMetadata),
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
