const _ = require('lodash');
const $ = require('jquery');
const L = require('leaflet');
const utils = require('common/js_utils');
const SvgFeatureMap = require('./views/SvgFeatureMap');
const GeospaceDataProvider = require('./dataProviders/GeospaceDataProvider');
const TileserverDataProvider = require('./dataProviders/TileserverDataProvider');
const SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const MetadataProvider = require('./dataProviders/MetadataProvider');
const VifHelpers = require('./helpers/VifHelpers');
const DataTypeFormatter = require('./views/DataTypeFormatter');
const I18n = require('common/i18n').default;
const getSoqlVifValidator = require('./dataProviders/SoqlVifValidator.js').getSoqlVifValidator;

const COLUMN_NAME_PATH = 'series[0].dataSource.dimension.columnName';
const DOMAIN_PATH = 'series[0].dataSource.domain';
const DATASET_UID_PATH = 'series[0].dataSource.datasetUid';
const DEFAULT_FEATURES_PER_TILE = 256 * 256;
// known in data lens as "simple blue"
const DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
const DEFAULT_BASE_LAYER_OPACITY = 0.42;
const WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata FeatureMap Visualization.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataSvgFeatureMap = function(originalVif, options) {
  utils.assert(
    _.isPlainObject(originalVif),
    'You must pass in a valid VIF to use socrataSvgFeatureMap'
  );

  originalVif = VifHelpers.migrateVif(originalVif);

  utils.assertHasProperties(
    originalVif,
    'series[0].dataSource.dimension.columnName',
    'series[0].dataSource.datasetUid',
    'series[0].dataSource.domain'
  );

  utils.assertIsOneOfTypes(originalVif.series[0].dataSource.dimension.columnName, 'string');
  utils.assertIsOneOfTypes(originalVif.series[0].dataSource.domain, 'string');
  utils.assertIsOneOfTypes(originalVif.series[0].dataSource.datasetUid, 'string');

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

  initializeVisualization(originalVif);

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
    var rerender = (extent, newColumns) => {
      var vectorTileGetter = buildVectorTileGetter(
        SoqlHelpers.whereClauseNotFilteringOwnColumn(newVif, 0)
      );

      visualization.clearError();
      visualization.render(newVif, { extent, vectorTileGetter }, newColumns);
    };

    if (didChangeDataSource(newVif, lastRenderedVif)) {
      initializeDataProviders(newVif);
      getDataFromProviders(newVif).then((resolutions) => {
        const newColumns = resolutions[0];
        const extent = resolutions[2];
        datasetMetadata = resolutions[1];

        rerender(extent, newColumns);
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
      messages = I18n.t(
        'shared.visualizations.charts.feature_map.error_incompatible_column'
      );
    } else {
      if (window.console && console.error) {
        console.error(error);
      }

      if (error.errorMessages) {
        messages = error.errorMessages;
      } else {
        messages = I18n.t('shared.visualizations.charts.common.error_generic');
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
      ).catch(function(e) {
        logError(e);
      });

    event.stopPropagation();
  }

  function handleRowInspectorQuerySuccess(data) {
    var rowInspectorTitleColumnName = _.get(lastRenderedVif, 'configuration.rowInspectorTitleColumnName');
    var getPageTitle = function(page) {
      var title = _.find(page, { column: rowInspectorTitleColumnName });
      // In case the column name cannot be found in 'page' to locate the title value
      return title ? title.value : null;
    };
    var formattedData = formatRowInspectorData(datasetMetadata, data);
    var titles = rowInspectorTitleColumnName ? _.map(formattedData, getPageTitle) : [];

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
            message: I18n.t(
              'shared.visualizations.charts.feature_map.row_inspector_row_data_query_failed'
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
    geospaceDataProvider = new GeospaceDataProvider({ domain, datasetUid }, true);

    // Tileserver serves tile data using the standard {z}/{x}/{y} URL
    // format. It returns protocol buffers containing point offsets from
    // the tile origin (top left).
    tileserverDataProvider = new TileserverDataProvider(
      {
        domain,
        datasetUid,
        columnName,
        featuresPerTile: DEFAULT_FEATURES_PER_TILE
      },
      true);

    // SoQL returns row results for display in the row inspector
    soqlDataProvider = new SoqlDataProvider({ domain, datasetUid }, true);
    metadataProvider = new MetadataProvider({ domain, datasetUid }, true);
  }

  function initializeVisualization(newVif) {
    var domain = _.get(newVif, DOMAIN_PATH);
    var datasetUid = _.get(newVif, DATASET_UID_PATH);
    var columnName = _.get(newVif, COLUMN_NAME_PATH);

    visualization = new SvgFeatureMap($element, newVif, options);
    attachEvents();

    // Binds all globally-scoped dataProviders.
    initializeDataProviders(newVif);
    getDataFromProviders(newVif).then((resolutions) => {
      var [newColumns, metadata, extent] = resolutions;
      datasetMetadata = metadata;

      visualization.render(
        newVif,
        {
          extent,
          vectorTileGetter: buildVectorTileGetter(
            SoqlHelpers.whereClauseNotFilteringOwnColumn(newVif, 0)
          )
        },
        newColumns
      );

      lastRenderedVif = newVif;
    }).catch((error) => {

      handleError(error);
      logError(error);
    });
  }

  function getDataFromProviders(newVif) {

    return $.fn.socrataSvgFeatureMap.validateVif(newVif).then(() => {
      var datasetMetadataRequest;
      var extentRequest;
      var columnName = _.get(newVif, COLUMN_NAME_PATH);

      if (metadataProvider) {
        datasetMetadataRequest = metadataProvider.getDatasetMetadata();
      } else {
        handleError();
      }

      if (_.has(newVif, 'configuration.mapCenterAndZoom')) {
        extentRequest = Promise.resolve();
      } else {
        extentRequest = geospaceDataProvider.getFeatureExtent(columnName);
      }

      const displayableFilterableColumns = visualization.shouldDisplayFilterBar() ?
        metadataProvider.getDisplayableFilterableColumns() :
        Promise.resolve(null);

      // We query the extent of the features we are rendering in order to make
      // individual tile requests more performant (through the use of a
      // WITHIN_BOX query clause).
      return Promise.all([
        displayableFilterableColumns,
        datasetMetadataRequest,
        extentRequest
      ]);
    });
  }

  function buildVectorTileGetter(whereClause) {

    return tileserverDataProvider.buildTileGetter(
      whereClause
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
        var columnMetadata = _.find(datasetMetadataColumns, { fieldName: columnName });

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
            var parentColumnMetadata = _.find(datasetMetadataColumns, { fieldName: parentColumnName });

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
              column: columnMetadata.name,
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
      // TODO For now. If this needs to change, make sure we build a distinct TileserverDataProvider
      // per domain (so it can use the correct tileserver hosts).
      requireAllSeriesFromSameDomain().
      toPromise()
  );

module.exports = $.fn.socrataSvgFeatureMap;
