var _ = require('lodash');
var $ = require('jquery');
var utils = require('common/js_utils');
var SvgRegionMap = require('./views/SvgRegionMap');
var MetadataProvider = require('./dataProviders/MetadataProvider');
var GeospaceDataProvider = require('./dataProviders/GeospaceDataProvider');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');
var VifHelpers = require('./helpers/VifHelpers');
var getSoqlVifValidator = require('./dataProviders/SoqlVifValidator.js').getSoqlVifValidator;
var I18n = require('common/i18n').default;

const NAME_ALIAS = '__NAME_ALIAS__';
const VALUE_ALIAS = '__VALUE_ALIAS__';
const BASE_QUERY = (
  'SELECT `{0}` AS {1}, {2} AS {3} {4} GROUP BY `{0}` ORDER BY {2} DESC NULL ' +
  'LAST LIMIT 5000'
);
const WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata Region Map Visualization.
 *
 * @param vif
 */
$.fn.socrataSvgRegionMap = function(originalVif, options) {
  originalVif = VifHelpers.migrateVif(originalVif);
  var $element = $(this);
  var visualization = new SvgRegionMap($element, originalVif, options);
  var lastRenderedVif;
  var rerenderOnResizeTimeout;

  /**
   * Event handling
   */

  function attachEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      clearTimeout(rerenderOnResizeTimeout);
      visualization.destroy();
      detachEvents();
    });

    $(window).on('resize', handleWindowResize);

    $element.on(
      'SOCRATA_VISUALIZATION_REGION_MAP_FLYOUT',
      handleRegionFlyout
    );
    $element.on(
      'SOCRATA_VISUALIZATION_REGION_MAP_LEGEND_FLYOUT',
      handleLegendFlyout
    );
    $element.on(
      'SOCRATA_VISUALIZATION_REGION_MAP_REGION_SELECTED',
      handleSelectRegion
    );
    $element.on(
      'SOCRATA_VISUALIZATION_REGION_MAP_CENTER_AND_ZOOM_CHANGED',
      handleMapCenterAndZoomChange
    );
    $element.on(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      visualization.invalidateSize
    );
    $element.on(
      'SOCRATA_VISUALIZATION_RENDER_VIF',
      handleRenderVif
    );
  }

  function detachEvents() {

    $(window).off('resize', handleWindowResize);

    $element.off(
      'SOCRATA_VISUALIZATION_REGION_MAP_FLYOUT',
      handleRegionFlyout
    );
    $element.off(
      'SOCRATA_VISUALIZATION_REGION_MAP_LEGEND_FLYOUT',
      handleLegendFlyout
    );
    $element.off(
      'SOCRATA_VISUALIZATION_REGION_MAP_REGION_SELECTED',
      handleSelectRegion
    );
    $element.off(
      'SOCRATA_VISUALIZATION_REGION_MAP_CENTER_AND_ZOOM_CHANGED',
      handleMapCenterAndZoomChange
    );
    $element.off(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      visualization.invalidateSize
    );
    $element.off(
      'SOCRATA_VISUALIZATION_RENDER_VIF',
      handleRenderVif
    );
  }

  function handleWindowResize() {

    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      visualization.invalidateSize,
      // Add some jitter in order to make sure multiple visualizations are
      // unlikely to all attempt to rerender themselves at the exact same
      // moment.
      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
    );
  }

  function handleSelectRegion(event) {
    var shapefileFeatureId = event.originalEvent.detail;
    var newVif = _.cloneDeep(lastRenderedVif);
    var columnName = _.get(newVif, 'series[0].dataSource.dimension.columnName');
    var filters = _.get(newVif, 'series[0].dataSource.filters', []);
    var ownFilterOperands = filters.
      filter(
        function(filter) {

          return (
            (filter.columnName === columnName) &&
            (filter.function === 'binaryComputedGeoregionOperator') &&
            (
              filter.arguments.computedColumnName ===
              newVif.configuration.computedColumnName
            )
          );
        }
      ).
      map(
        function(filter) {
          return filter.arguments.operand;
        }
      );

    newVif.filters = filters.
      filter(function(filter) {

        return (
          (filter.columnName !== columnName) &&
          (filter.function !== 'binaryComputedGeoregionOperator') &&
          (
            filter.arguments.computedColumnName !==
            newVif.configuration.computedColumnName
          )
        );
      });

    event.originalEvent.stopPropagation();

    if (ownFilterOperands.indexOf(shapefileFeatureId) === -1) {

      filters.
        push(
          {
            'columnName': columnName,
            'function': 'binaryComputedGeoregionOperator',
            'arguments': {
              'computedColumnName': newVif.configuration.computedColumnName,
              'operator': '=',
              'operand': shapefileFeatureId
            }
          }
        );
    }

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_VIF_UPDATED',
        {
          detail: newVif,
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

  function handleRenderVif(event) {
    var newVif = VifHelpers.migrateVif(event.originalEvent.detail);
    var type = _.get(newVif, 'series[0].type');

    if (type !== 'regionMap' && type !== 'choroplethMap') {
      throw new Error(
        'Cannot update VIF; old type: `regionMap`, new type: `{0}`.'.
          format(type)
      );
    }

    updateData(newVif);
  }

  /**
   * Flyout handlers
   */

  function handleRegionFlyout(event) {
    var payload = event.originalEvent.detail;
    var flyoutContent;
    var flyoutTable;
    var flyoutElements;
    var flyoutTitle;
    var flyoutValueLabelCell;
    var flyoutValueCell;
    var flyoutValueRow;
    var filteredRowClass;
    var flyoutSpacerRow;
    var flyoutSelectedNoticeLabel;
    var flyoutSelectedNoticeRow;
    var flyoutPayload;

    event.originalEvent.stopPropagation();

    if (payload === null) {
      emitFlyoutEvent(null);
    } else {
      flyoutContent = $(document.createDocumentFragment());
      flyoutTable = $('<table>', { 'class': 'socrata-flyout-table' });
      flyoutElements = [];

      // 'Datum Title'
      flyoutTitle = $(
        '<div>',
        {
          'class': 'socrata-flyout-title'
        }
      ).text(payload.title);

      // 'Total: XXX rows'
      flyoutValueLabelCell = $(
        '<td>',
        {
          'class': 'socrata-flyout-cell'
        }
      ).text(payload.valueLabel);

      flyoutValueCell = $(
        '<td>',
        {
          'class': 'socrata-flyout-cell'
        }
      ).text(payload.value);

      flyoutValueRow = $(
        '<tr>',
        {
          'class': 'socrata-flyout-row'
        }
      ).append([
        flyoutValueLabelCell,
        flyoutValueCell
      ]);

      flyoutElements.push(flyoutValueRow);

      // If we are hovering over a region we are
      // currently filtering by, then display a special
      // flyout message.
      if (payload.selected) {

        // 'This visualization is currently filtered...'
        flyoutSpacerRow = $(
          '<tr>',
          {
            'class': 'socrata-flyout-row',
            'colspan': '2'
          }
        ).append(
          $('<td>', { 'class': 'socrata-flyout-cell' }).html('&#8203;')
        );

        flyoutSelectedNoticeLabel = $(
          '<td>',
          {
            'class': 'socrata-flyout-cell'
          }
        ).text(payload.selectedNotice);

        flyoutSelectedNoticeRow = $(
          '<tr>',
          {
            'class': 'socrata-flyout-row',
            'colspan': '2'
          }
        ).append([
          flyoutSelectedNoticeLabel
        ]);

        flyoutElements.push(flyoutSpacerRow);
        flyoutElements.push(flyoutSelectedNoticeRow);
      }

      flyoutTable.append(flyoutElements);

      flyoutContent.append([
        flyoutTitle,
        flyoutTable
      ]);

      flyoutPayload = {
        flyoutOffset: {
          left: payload.clientX,
          top: payload.clientY
        },
        content: flyoutContent,
        dark: true,
        rightSideHint: false,
        belowTarget: false
      };

      emitFlyoutEvent(flyoutPayload);
    }
  }

  function handleLegendFlyout(event) {
    var payload = event.originalEvent.detail;
    var flyoutContent;
    var flyoutPayload;

    event.originalEvent.stopPropagation();

    if (payload === null) {
      emitFlyoutEvent(null);
    } else {

      flyoutContent = `<div class="flyout-title">${payload.title}</div>`

      // Assemble payload
      flyoutPayload = {
        element: payload.element,
        content: flyoutContent,
        dark: true,
        rightSideHint: false,
        belowTarget: false
      };

      // Dispatch new event for example
      emitFlyoutEvent(flyoutPayload);
    }
  }

  function hideFlyout() {
    emitFlyoutEvent(null);
  }

  function emitFlyoutEvent(payload) {

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_FLYOUT',
        {
          detail: payload,
          bubbles: true
        }
      )
    );
  }

  function logError(error) {
    if (window.console && window.console.error) {
      console.error(error);
    }
  }

  function updateData(vifToRender) {
    utils.assertHasProperties(
      vifToRender,
      'configuration.computedColumnName',
      'configuration.shapefile.primaryKey',
      'configuration.shapefile.uid',
      'series[0].dataSource.dimension.columnName',
      'series[0].dataSource.domain',
      'series[0].dataSource.datasetUid'
    );

    utils.assertIsOneOfTypes(
      _.get(vifToRender, 'configuration.computedColumnName'),
      'string'
    );

    utils.assertIsOneOfTypes(
      _.get(vifToRender, 'configuration.shapefile.primaryKey'),
      'string'
    );

    utils.assertIsOneOfTypes(
      _.get(vifToRender, 'configuration.shapefile.uid'),
      'string'
    );

    utils.assertIsOneOfTypes(
      _.get(vifToRender, 'series[0].dataSource.dimension.columnName'),
      'string'
    );

    utils.assertIsOneOfTypes(
      _.get(vifToRender, 'series[0].dataSource.domain'),
      'string'
    );

    utils.assertIsOneOfTypes(
      _.get(vifToRender, 'series[0].dataSource.datasetUid'),
      'string'
    );

    visualization.showBusyIndicator();

    $.fn.socrataSvgRegionMap.validateVif(vifToRender).then(() => {
      const columnName = _.get(vifToRender, 'series[0].dataSource.dimension.columnName');
      const domain = _.get(vifToRender, 'series[0].dataSource.domain');
      const datasetUid = _.get(vifToRender, 'series[0].dataSource.datasetUid');
      const shapefileUid = _.get(vifToRender, 'configuration.shapefile.uid');
      const computedColumnName = _.get(vifToRender, 'configuration.computedColumnName');
      const geometryLabel = _.get(vifToRender, 'configuration.shapefile.geometryLabel');
      const primaryKey = _.get(vifToRender, 'configuration.shapefile.primaryKey');
      const filters = _.get(vifToRender, 'series[0].dataSource.filters', []);

      const dataSource = { domain, datasetUid };
      const datasetMetadataProvider = new MetadataProvider(dataSource, true);
      const datasetGeospaceDataProvider = new GeospaceDataProvider(dataSource, true);
      const soqlDataProvider = new SoqlDataProvider(dataSource, true);
      const datasetColumnExtentDataProvider = new SoqlDataProvider(dataSource, true);

      const shapefileDataSource = { domain, datasetUid: shapefileUid };
      const shapefileMetadataProvider = new MetadataProvider(shapefileDataSource, true);
      const shapefileGeospaceDataProvider = new GeospaceDataProvider(shapefileDataSource, true);

      const aggregationClause = SoqlHelpers.aggregationClause(vifToRender, 0, 'measure');

      const whereClauseComponents = SoqlHelpers.
        whereClauseFilteringOwnColumn(vifToRender, 0);
      const whereClause = (whereClauseComponents) ?
        `WHERE ${whereClauseComponents}` :
        '';

      const queryString = BASE_QUERY.format(
        computedColumnName,
        NAME_ALIAS,
        aggregationClause,
        VALUE_ALIAS,
        whereClause
      );

      const hasGeometryLabel = _.isString(geometryLabel);
      const hasPrimaryKey = _.isString(primaryKey);

      const shapefileMetadataRequest = (hasGeometryLabel && hasPrimaryKey) ?
        // This fake shapefile dataset metadata response is used so that we can
        // conform to the promise chain all the way down to visualization render,
        // rather than conditionally requiring one or two requests to complete
        // before proceeding.
        Promise.resolve({ geometryLabel, featurePk: primaryKey }) :
        // If the shapefile metadata request fails, we can still proceed,
        // albeit with degraded flyout behavior. This is because the only
        // thing we're trying to get from the shapefile metadata is the
        // geometryLabel (the column in the shapefile that corresponds to a
        // human-readable name for each region) and, if it is not present,
        // the visualization will simply not show the human-readable name in
        // the flyout at all (it will still show values).
        //
        // Accordingly, we still want to resolve this promise in its error
        // state.
        shapefileMetadataProvider.getShapefileMetadata().catch((error) => {
          logError(error);
          return { geometryLabel: null };
        });

      const featureExtentRequest = datasetGeospaceDataProvider.getFeatureExtent(columnName);
      const soqlQueryRequest = soqlDataProvider.query(queryString, NAME_ALIAS, VALUE_ALIAS);
      const displayableFilterableColumns = visualization.shouldDisplayFilterBar() ?
        datasetMetadataProvider.getDisplayableFilterableColumns() :
        Promise.resolve(null);

      const requests = [
        shapefileMetadataRequest,
        featureExtentRequest,
        soqlQueryRequest,
        displayableFilterableColumns
      ];

      return Promise.all(requests).then((values) => {
        const shapefileMetadata = values[0];
        const featureExtent = values[1];
        const soqlQueryResponse = values[2];
        const newColumns = values[3];

        const data = soqlQueryResponse.rows.map((row) => {
          return { name: row[0], value: parseInt(row[1], 10) }
        });

        const processShapefile = (shapefile) => {
          const dataAsHash = _.mapValues(_.keyBy(data, 'name'), 'value');
          const ownFilterOperands = filters.filter((filter) => {
            const filterFunction = _.get(filter, 'function');
            const filteredComputedColumnName = _.get(filter, 'arguments.computedColumnName');

            const isFilteredColumn = filter.columnName === columnName;
            const isBinaryComputedGeoregionOperator = (
              filterFunction === 'binaryComputedGeoregionOperator'
            );
            const isFilteredComputedColumn = (
              filteredComputedColumnName === computedColumnName
            );

            return (
              isFilteredColumn &&
              isBinaryComputedGeoregionOperator &&
              isFilteredComputedColumn
            );
          }).
          map((filter) => filter.arguments.operand);

          return mergeRegionAndData(
            shapefileMetadata.geometryLabel,
            shapefileMetadata.featurePk,
            shapefile,
            dataAsHash,
            ownFilterOperands,
            vifToRender
          );
        };

        shapefileGeospaceDataProvider.
          getShapefile(featureExtent).
          then((shapefile) => {
            return shapefile.features.length === 0 ?
              shapefileGeospaceDataProvider.getShapefile().then(processShapefile) :
              processShapefile(shapefile);
          }).
          then((data) => {
            visualization.hideBusyIndicator();
            visualization.render(vifToRender, data, newColumns);
            lastRenderedVif = vifToRender;
          }).
          catch(handleError);
      })
    }).
    catch(handleError);
  }

  function handleError(error) {
    var messages;

    if (window.console && console.error) {
      console.error(error);
    }

    if (error.errorMessages) {
      messages = error.errorMessages;
    } else {
      messages = I18n.t('shared.visualizations.charts.common.error_generic')
    }

    visualization.renderError(messages);
  }

  /**
   * Data Formatting Functions
   */

  /**
   * @param {String} geometryLabel - The name of the property that should be
   *   used as the 'human-readable' name for a region.
   * @param {String} primaryKey - Name of the property to be used as the
   *   primary key
   * @param {Object} geojsonRegions - The source GeoJSON shape file.
   * @param {Object} dataAsHash - The values associated with each region.
   * @param {String[]} ownFilterOperands.
   *
   * @return {Object} - A GeoJSON shape file.
   */
  function mergeRegionAndData(
    geometryLabel,
    primaryKey,
    geojsonRegions,
    dataAsHash,
    ownFilterOperands,
    vifToRender
  ) {

    var newFeatures = _.chain(_.get(geojsonRegions, 'features', [])).
      filter(function(geojsonFeature) {
        return _.get(geojsonFeature, `properties.${primaryKey}`);
      }).
      map(function(geojsonFeature) {
        var name = _.get(geojsonFeature, `properties.${primaryKey}`);
        var value = Number(dataAsHash[name]);
        var humanReadableName = _.get(
          geojsonFeature,
          `properties.${geometryLabel}`,
          ''
        );
        var properties = {};

        properties[primaryKey] = name;
        properties[SvgRegionMap.SHAPEFILE_REGION_HUMAN_READABLE_NAME] = humanReadableName;
        // EN-8796 - Region map flyout reads 'NaN rows'
        //
        // The line below previously returned null if _.isNumber(value) was
        // false. This didn't account for NaN, however (_.isNumber(NaN) is
        // true), so check instead if _.isFinite when deciding whether to
        // pass on the value as received or null (which signifies 'no value').
        properties[SvgRegionMap.SHAPEFILE_REGION_VALUE] = (_.isFinite(value)) ? value : null;
        properties[SvgRegionMap.SHAPEFILE_REGION_IS_SELECTED] = _.includes(ownFilterOperands, name);

        // Create a new object to get rid of superfluous shapefile-specific
        // fields coming out of the backend.
        return {
          geometry: geojsonFeature.geometry,
          properties: properties,
          type: geojsonFeature.type
        };
      }).value();

    return {
      crs: geojsonRegions.crs,
      features: newFeatures,
      type: geojsonRegions.type
    };
  }

  /**
   * Actual execution starts here
   */

  attachEvents();
  updateData(originalVif);

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
$.fn.socrataSvgRegionMap.validateVif = (vif) =>
  getSoqlVifValidator(vif).then(validator =>
    validator.
      requireAtLeastOneSeries().
      requireMeasureAggregation().
      requirePointDimension().
      toPromise()
  );

module.exports = $.fn.socrataSvgRegionMap;
