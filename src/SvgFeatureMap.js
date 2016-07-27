const _ = require('lodash');
const $ = require('jquery');
const L = require('leaflet');
const utils = require('socrata-utils');
const SvgFeatureMap = require('./views/SvgFeatureMap');
const GeospaceDataProvider = require('./dataProviders/GeospaceDataProvider');
const TileserverDataProvider = require('./dataProviders/TileserverDataProvider');
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const MetadataProvider = require('./dataProviders/MetadataProvider');
const VifHelpers = require('./helpers/VifHelpers');
const DataTypeFormatter = require('./views/DataTypeFormatter');
const I18n = require('./I18n');
const getSoqlVifValidator = require('./dataProviders/SoqlVifValidator.js').getSoqlVifValidator;

const COLUMN_NAME_PATH = 'series[0].dataSource.dimension.columnName';
const DOMAIN_PATH = 'series[0].dataSource.domain';
const DATASET_UID_PATH = 'series[0].dataSource.datasetUid';
const DEFAULT_TILESERVER_HOSTS = [
  'https://tileserver1.api.us.socrata.com',
  'https://tileserver2.api.us.socrata.com',
  'https://tileserver3.api.us.socrata.com',
  'https://tileserver4.api.us.socrata.com'
];
const DEFAULT_FEATURES_PER_TILE = 256 * 256;
// known in data lens as "simple blue"
const DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
const DEFAULT_BASE_LAYER_OPACITY = 0.42;
const WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata FeatureMap Visualization from the
 * `socrata-visualizations` package.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataSvgFeatureMap = function(vif) {
  utils.assert(
    _.isPlainObject(vif),
    'You must pass in a valid VIF to use socrataSvgFeatureMap'
  );

  vif = VifHelpers.migrateVif(vif);

  utils.assertHasProperties(
    vif,
    'series[0].dataSource.dimension.columnName',
    'series[0].dataSource.datasetUid',
    'series[0].dataSource.domain',
    'series[0].unit.one',
    'series[0].unit.other'
  );

  utils.assertIsOneOfTypes(vif.series[0].dataSource.dimension.columnName, 'string');
  utils.assertIsOneOfTypes(vif.series[0].dataSource.domain, 'string');
  utils.assertIsOneOfTypes(vif.series[0].dataSource.datasetUid, 'string');
  utils.assertIsOneOfTypes(vif.series[0].unit.one, 'string');
  utils.assertIsOneOfTypes(vif.series[0].unit.other, 'string');

  var $element = $(this);
  var datasetMetadata;
  var datasetMetadataRequest;
  var extentRequest;
  var geospaceDataProvider;
  var tileserverDataProvider;
  var soqlDataProvider;
  var metadataProvider;
  var visualization;
  var rerenderOnResizeTimeout;
  var lastRenderedVif;

  initializeVisualization(vif);

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
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function detachEvents() {

    $element.off('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleVisualizationFlyoutShow);
    $element.off('SOCRATA_VISUALIZATION_FLYOUT_HIDE', handleVisualizationFlyoutHide);
    $element.off('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);
    $element.off('SOCRATA_VISUALIZATION_FEATURE_MAP_CENTER_AND_ZOOM_CHANGE', handleMapCenterAndZoomChange);
    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  /**
   * Event handlers
   */

  function handleRenderVif(event) {
    var newVif = event.originalEvent.detail;
    var rerender = () => {
      var vectorTileGetter = buildVectorTileGetter(
        SoqlHelpers.whereClauseNotFilteringOwnColumn(newVif, 0),
        newVif.configuration.useOriginHost
      );

      visualization.clearError();
      visualization.render(newVif, { vectorTileGetter });
    };

    if (didChangeDataSource(newVif, lastRenderedVif)) {
      initializeDataProviders(newVif);
      getDataFromProviders(newVif).then((resolutions) => {
        datasetMetadata = resolutions[0];
        rerender();
      }).catch(handleError);
    } else {
      rerender();
    }

    lastRenderedVif = newVif;
  }

  function didChangeDataSource(newVif, lastRenderedVif) {
    var dataSourcePath = 'series[0].dataSource';
    return !_.isEqual(
      _.get(newVif, dataSourcePath),
      _.get(lastRenderedVif, dataSourcePath)
    );
  }

  function handleError(error) {
    var messages;
    var errorCode = _.get(error, 'soqlError.errorCode');

    if (errorCode === 'query.soql.type-mismatch') {
      messages = I18n.translate(
        'visualizations.feature_map.error_incompatible_column'
      );
    } else {
      if (window.console && console.error) {
        console.error(error);
      }

      if (error.errorMessages) {
        messages = error.errorMessages;
      } else {
        messages = I18n.translate('visualizations.common.error_generic')
      }
    }

    visualization.renderError(messages);
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
    var columnName = _.get(lastRenderedVif, COLUMN_NAME_PATH);

    var whereClause = SoqlHelpers.whereClauseNotFilteringOwnColumn(lastRenderedVif, 0);
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
      )['catch'](function(e) {
        logError(e);
      });

    event.stopPropagation();
  }

  function handleRowInspectorQuerySuccess(data) {
    var flyoutTitleColumnName = _.get(lastRenderedVif, 'configuration.flyoutTitleColumnName');
    var getPageTitle = function(page) {
      return _.find(page, {column: flyoutTitleColumnName}).value;
    };
    var formattedData = formatRowInspectorData(datasetMetadata, data);
    var titles = flyoutTitleColumnName ? _.map(formattedData, getPageTitle) : [];

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
            message: I18n.translate(
              'visualizations.feature_map.row_inspector_row_data_query_failed'
            )
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

  function initializeDataProviders(newVif) {
    var domain = _.get(newVif, DOMAIN_PATH);
    var datasetUid = _.get(newVif, DATASET_UID_PATH);
    var columnName = _.get(newVif, COLUMN_NAME_PATH);

    // Geospace has knowledge of the extents of a column, which
    // we use to modify point data queries with a WITHIN_BOX clause.
    geospaceDataProvider = new GeospaceDataProvider({ domain, datasetUid });

    // Tileserver serves tile data using the standard {z}/{x}/{y} URL
    // format. It returns protocol buffers containing point offsets from
    // the tile origin (top left).
    tileserverDataProvider = new TileserverDataProvider({
      domain,
      datasetUid,
      columnName,
      featuresPerTile: DEFAULT_FEATURES_PER_TILE,
      tileserverHosts: newVif.configuration.tileserverHosts || DEFAULT_TILESERVER_HOSTS
    });

    // SoQL returns row results for display in the row inspector
    soqlDataProvider = new SoqlDataProvider({ domain, datasetUid });

    metadataProvider = newVif.configuration.datasetMetadata ?
      null :
      new MetadataProvider({ domain, datasetUid });
  }

  function initializeVisualization(newVif) {
    var domain = _.get(newVif, DOMAIN_PATH);
    var datasetUid = _.get(newVif, DATASET_UID_PATH);
    var columnName = _.get(newVif, COLUMN_NAME_PATH);

    visualization = new SvgFeatureMap($element, newVif);
    lastRenderedVif = newVif;

    // Binds all globally-scoped dataProviders.
    initializeDataProviders(newVif);
    getDataFromProviders(newVif).then((resolutions) => {
      var [metadata, extent] = resolutions;
      datasetMetadata = metadata;

      attachEvents();

      visualization.render(
        false,
        {
          extent,
          vectorTileGetter: buildVectorTileGetter(
            SoqlHelpers.whereClauseNotFilteringOwnColumn(newVif, 0),
            newVif.configuration.useOriginHost
          )
        }
      );
    }).catch((e) => {
      handleError(e);
      logError(e);
    });
  }

  function getDataFromProviders(newVif) {
    return $.fn.socrataSvgFeatureMap.validateVif(newVif).then(() => {
      var datasetMetadataRequest;
      var extentRequest;
      var columnName = _.get(newVif, COLUMN_NAME_PATH);

      if (_.isPlainObject(newVif.configuration.datasetMetadata)) {
        datasetMetadataRequest = newVif.configuration.datasetMetadata;
      } else if (metadataProvider) {
        datasetMetadataRequest = metadataProvider.getDatasetMetadata();
      } else {
        handleError();
      }

      if (_.has(newVif, 'configuration.mapCenterAndZoom')) {
        extentRequest = Promise.resolve();
      } else {
        extentRequest = geospaceDataProvider.getFeatureExtent(columnName);
      }

      /**
       * Initial data requests to set up visualization state
       */

      // We query the extent of the features we are rendering in order to make
      // individual tile requests more performant (through the use of a
      // WITHIN_BOX query clause).
      return Promise.all([
        datasetMetadataRequest,
        extentRequest
      ]);
    });
  }

  function buildVectorTileGetter(whereClause, useOriginHost) {

    return tileserverDataProvider.buildTileGetter(
      whereClause,
      useOriginHost || false
    );
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
              value: DataTypeFormatter.renderCell(columnValue, columnMetadata),
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

// Checks a VIF for compatibility with this visualization.
// The intent of this function is to provide feedback while
// authoring a visualization, not to provide feedback to a developer.
// As such, messages returned are worded to make sense to a user.
//
// Returns a Promise.
//
// If the VIF is usable, the promise will resolve.
// If the VIF is not usable, the promise will reject with an object:
// {
//   ok: false,
//   errorMessages: Array<String>
// }
$.fn.socrataSvgFeatureMap.validateVif = (vif) =>
  getSoqlVifValidator(vif).then(validator =>
    validator.
      requireAtLeastOneSeries().
      requirePointDimension().
      toPromise()
  );

module.exports = $.fn.socrataSvgFeatureMap;
