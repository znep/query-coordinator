var _ = require('lodash');
var $ = require('jquery');
var utils = require('common/js_utils');
var ChoroplethMap = require('./views/ChoroplethMap');
var MetadataProvider = require('./dataProviders/MetadataProvider');
var GeospaceDataProvider = require('./dataProviders/GeospaceDataProvider');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');

var DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
var DEFAULT_BASE_LAYER_OPACITY = 0.8;
var NAME_ALIAS = '__NAME_ALIAS__';
var VALUE_ALIAS = '__VALUE_ALIAS__';
var BASE_QUERY = 'SELECT `{0}` AS {1}, {2} AS {3} {4} GROUP BY `{0}` ORDER BY {2} DESC NULL LAST LIMIT 200';
var WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata Choropleth Visualization.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataChoroplethMap = function(vif) {

  utils.assert(
    _.isPlainObject(vif),
    'You must pass in a valid VIF to use socrataChoroplethMap'
  );

  utils.assertHasProperties(
    vif,
    'configuration.localization',
    'configuration.computedColumnName',
    'configuration.shapefile.primaryKey',
    'configuration.shapefile.uid',
    'columnName',
    'domain',
    'datasetUid',
    'unit.one',
    'unit.other'
  );

  utils.assertIsOneOfTypes(vif.configuration.computedColumnName, 'string');
  utils.assertIsOneOfTypes(vif.configuration.shapefile.primaryKey, 'string');
  utils.assertIsOneOfTypes(vif.configuration.shapefile.uid, 'string');
  utils.assertIsOneOfTypes(vif.columnName, 'string');
  utils.assertIsOneOfTypes(vif.domain, 'string');
  utils.assertIsOneOfTypes(vif.datasetUid, 'string');
  utils.assertIsOneOfTypes(vif.unit.one, 'string');
  utils.assertIsOneOfTypes(vif.unit.other, 'string');

  /**
   * Setup visualization
   */
  var $element = $(this);

  var visualization = new ChoroplethMap($element, vif);

  var columnName = _.get(vif, 'columnName');
  var domain = _.get(vif, 'domain');
  var datasetUid = _.get(vif, 'datasetUid');

  // Setup Data Providers
  var shapefileMetadataProviderConfig = {
    domain: domain,
    datasetUid: vif.configuration.shapefile.uid
  };

  var shapefileMetadataProvider = new MetadataProvider(
    shapefileMetadataProviderConfig
  );

  var datasetGeospaceDataProviderConfig = {
    domain: domain,
    datasetUid: datasetUid
  };

  var datasetGeospaceDataProvider = new GeospaceDataProvider(
    datasetGeospaceDataProviderConfig
  );

  var shapefileGeospaceDataProviderConfig = {
    domain: domain,
    datasetUid: vif.configuration.shapefile.uid
  };

  var shapefileGeospaceDataProvider = new GeospaceDataProvider(
    shapefileGeospaceDataProviderConfig
  );

  var soqlDataProviderConfig = {
    domain: domain,
    datasetUid: datasetUid
  };

  var unfilteredSoqlDataProvider = new SoqlDataProvider(
    soqlDataProviderConfig
  );

  var filteredSoqlDataProvider = new SoqlDataProvider(
    soqlDataProviderConfig
  );

  var cachedShapefile;

  var datasetColumnExtentDataProvider = new SoqlDataProvider(
    soqlDataProviderConfig
  );

  var shapefileMetadataRequest;
  var featureExtentRequest;
  var cachedGeometryLabel;
  var rerenderOnResizeTimeout;
  var lastRenderedVif;

  attachEvents();

  if (_.isString(vif.configuration.shapefile.geometryLabel)) {
    // This fake shapefile dataset metadata response is used so that we can
    // conform to the promise chain all the way down to visualization render,
    // rather than conditionally requiring one or two requests to complete
    // before proceeding.
    shapefileMetadataRequest = Promise.resolve({
      geometryLabel: vif.configuration.shapefile.geometryLabel
    });

  } else {

    shapefileMetadataRequest = shapefileMetadataProvider.
      getShapefileMetadata().
      catch(
        function(error) {
          logError(error);

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
          return {
            geometryLabel: null
          };
        }
      );
  }

  featureExtentRequest = datasetGeospaceDataProvider.
    getFeatureExtent(columnName).
    // If the request has succeeded, return the response (using _.identity());
    // if it failed then log the resulting error.
    then(
      _.identity,
      logError
    );

  Promise.
    all([shapefileMetadataRequest, featureExtentRequest]).
    then(function(values) {
      var shapefileMetadata = values[0];
      var featureExtent = values[1];

      shapefileGeospaceDataProvider.
        getShapefile(featureExtent).
        then(
          function(shapefile) {

            // First cache the geometryLabel and shapefile so that we only need
            // to request them once per page load.
            //
            // Downstream users of geometryLabel expect null, but will probably
            // behave ok with undefined; regardless, default to null if the
            // property does not exist.
            cachedGeometryLabel = shapefileMetadata.geometryLabel || null;
            cachedShapefile = shapefile;
            // Next, render base layer.
            visualization.updateTileLayer(getRenderOptions(vif));
            // Finally, make the data queries and prepare to draw the choropleth
            // regions.
            updateData(vif);
          },
          function(error) {
            logError(error);
          }
        );
    }
    );

  function getRenderOptions(vifToRender) {
    var filters = _.get(vifToRender, 'filters', []);

    return {
      baseLayer: {
        url: vifToRender.configuration.baseLayerUrl || DEFAULT_BASE_LAYER_URL,
        opacity: vifToRender.configuration.baseLayerOpacity || DEFAULT_BASE_LAYER_OPACITY
      },
      showFiltered: filters > 0,
      vif: vifToRender
    };
  }

  /**
   * Fetches SOQL data and aggregates with shapefile geoJSON
   */
  function updateData(vifToRender) {
    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

    var aggregationClause = SoqlHelpers.aggregationClause(vifToRender, 0, 'measure');
    var whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(vifToRender, 0);
    var unfilteredQueryString = BASE_QUERY.format(
      vifToRender.configuration.computedColumnName,
      NAME_ALIAS,
      aggregationClause,
      VALUE_ALIAS,
      ''
    );
    var filteredQueryString = BASE_QUERY.format(
      vifToRender.configuration.computedColumnName,
      NAME_ALIAS,
      aggregationClause,
      VALUE_ALIAS,
      (whereClauseComponents) ? 'WHERE {0}'.format(whereClauseComponents) : ''
    );
    var unfilteredSoqlQuery = unfilteredSoqlDataProvider.
      query(unfilteredQueryString, NAME_ALIAS, VALUE_ALIAS).catch(function(error) {
        logError(error);
        visualization.renderError();
      });
    var filteredSoqlQuery = filteredSoqlDataProvider.
      query(filteredQueryString, NAME_ALIAS, VALUE_ALIAS).catch(function(error) {
        logError(error);
        visualization.renderError();
      });

    Promise.
      all([unfilteredSoqlQuery, filteredSoqlQuery]).
      then(function(values) {
        var unfilteredQueryResponse = values[0].rows.map(function(row) {
          var value = parseInt(row[1], 10);

          return {
            name: row[0],
            value: value
          };
        });
        var filteredQueryResponse = values[1].rows.map(function(row) {
          var value = parseInt(row[1], 10);

          return {
            name: row[0],
            value: value
          };
        });

        // Consolidate configuration and data into one object
        var aggregatedData = aggregateGeoJsonData(
          cachedGeometryLabel,
          vifToRender.configuration.shapefile.primaryKey,
          cachedShapefile,
          unfilteredQueryResponse,
          filteredQueryResponse,
          vifToRender
        );

        if (vifToRender) {
          lastRenderedVif = vifToRender;
        }

        visualization.render(
          aggregatedData,
          getRenderOptions(lastRenderedVif)
        );

        $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
      }).catch(function(error) {
        logError(error);
        visualization.renderError();
      });
  }

  // TODO: Come back and remove assumptions about filtered v.s. unfiltered data
  // once Data Lens does so.

  /**
   * Data Formatting Functions
   */

  /**
   * See CardVisualizationChoroplethHelpers.js in the frontend repo for more
   * details about aggregateGeoJsonData
   *
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
   * @param {Object[]} vifToRender - The vif that is being rendered.
   *
   * @return {Object} (See mergeRegionAndData)
   */
  function aggregateGeoJsonData(
    geometryLabel,
    primaryKey,
    geojsonRegions,
    unfilteredData,
    filteredData,
    vifToRender) {

    var unfilteredDataAsHash = _.mapValues(_.keyBy(unfilteredData, 'name'), 'value');
    var filteredDataAsHash = _.mapValues(_.keyBy(filteredData, 'name'), 'value');
    var filters = _.get(vifToRender, 'filters', []);

    var ownFilterOperands = filters.
      filter(
        function(filter) {
          var columnName = _.get(vifToRender, 'columnName');

          return (
            (filter.columnName === columnName) &&
            (filter.function === 'binaryComputedGeoregionOperator') &&
            (filter.arguments.computedColumnName === vifToRender.configuration.computedColumnName)
          );
        }
      ).
      map(
        function(filter) {
          return filter.arguments.operand;
        }
      );

    return mergeRegionAndData(
      geometryLabel,
      primaryKey,
      geojsonRegions,
      unfilteredDataAsHash,
      filteredDataAsHash,
      ownFilterOperands
    );
  }

  /**
   * See CardVisualizationChoroplethHelpers.js in the frontend repo for more
   * details about mergeRegionAndData
   *
   * @param {String} geometryLabel - The name of the property that should be
   *   used as the 'human-readable' name for a region.
   * @param {String} primaryKey - Name of the property to be used as the primary key
   * @param {Object} geojsonRegions - The source GeoJSON shape file.
   * @param {Object} unfilteredDataAsHash - The aggregate unfiltered values
   *   associated with each region.
   * @param {Object} filteredDataAsHash - The aggregate filtered values
   *   associated with each region.
   * @param {String[]} activeFilterNames - An array of currently-filtered regions
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
  function mergeRegionAndData(
    geometryLabel,
    primaryKey,
    geojsonRegions,
    unfilteredDataAsHash,
    filteredDataAsHash,
    ownFilterOperands
  ) {

    var newFeatures = _.chain(_.get(geojsonRegions, 'features', [])).
      filter(function(geojsonFeature) {
        return _.get(geojsonFeature, 'properties.{0}'.format(primaryKey));
      }).
      map(function(geojsonFeature) {
        var name = _.get(geojsonFeature, 'properties.{0}'.format(primaryKey));
        var humanReadableName = _.get(geojsonFeature, 'properties.{0}'.format(geometryLabel), '');
        var properties = {};

        properties[primaryKey] = name;
        properties[vif.configuration.shapefile.columns.name] = humanReadableName;
        properties[vif.configuration.shapefile.columns.filtered] = filteredDataAsHash[name] || null;
        properties[vif.configuration.shapefile.columns.unfiltered] = unfilteredDataAsHash[name];
        properties[vif.configuration.shapefile.columns.selected] = _.includes(ownFilterOperands, name);

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

    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT', handleFlyout);
    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION', handleSelection);
    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_CENTER_AND_ZOOM_CHANGE', handleMapCenterAndZoomChange);
    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function detachEvents() {

    $(window).off('resize', handleWindowResize);

    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT', handleFlyout);
    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION', handleSelection);
    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_CENTER_AND_ZOOM_CHANGE', handleMapCenterAndZoomChange);
    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
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

  function handleFlyout(event) {
    var payload = event.originalEvent.detail;

    event.originalEvent.stopPropagation();

    if (_.isNull(payload)) {
      hideFlyout();
    } else if (_.has(payload, 'element.feature')) {
      showFeatureFlyout(payload);
    } else {
      showLegendFlyout(payload);
    }
  }

  function handleSelection(event) {
    var payload = event.originalEvent.detail;
    var newVif = _.cloneDeep(lastRenderedVif);
    var columnName = _.get(newVif, 'columnName');
    var filters = _.get(newVif, 'filters', []);
    var ownFilterOperands = filters.
      filter(
        function(filter) {

          return (
            (filter.columnName === columnName) &&
            (filter.function === 'binaryComputedGeoregionOperator') &&
            (filter.arguments.computedColumnName === newVif.configuration.computedColumnName)
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
          (filter.arguments.computedColumnName !== newVif.configuration.computedColumnName)
        );
      });

    event.originalEvent.stopPropagation();

    if (ownFilterOperands.indexOf(payload.shapefileFeatureId) === -1) {

      newVif.filters.
        push(
        {
          'columnName': columnName,
          'function': 'binaryComputedGeoregionOperator',
          'arguments': {
            'computedColumnName': newVif.configuration.computedColumnName,
            'operator': '=',
            'operand': payload.shapefileFeatureId
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
    var newVif = event.originalEvent.detail;
    var type = _.get(newVif, 'type');

    if (type !== 'choroplethMap') {
      throw new Error(
        'Cannot update VIF; old type: `choroplethMap`, new type: `{0}`.'.
          format(type)
      );
    }

    updateData(newVif);
  }

  /**
   * Flyout handlers
   */

  function showFeatureFlyout(payload) {
    var flyoutPayload;
    var flyoutContent;
    var flyoutTable;
    var flyoutElements;
    var flyoutTitle;
    var flyoutUnfilteredValueLabelCell;
    var flyoutUnfilteredValueCell;
    var flyoutUnfilteredValueRow;
    var filteredRowClass;
    var flyoutFilteredValueLabelCell;
    var flyoutFilteredValueCell;
    var flyoutFilteredValueRow;
    var flyoutSpacerRow;
    var flyoutSelectedNoticeLabel;
    var flyoutSelectedNoticeRow;

    if (payload !== null) {

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
      flyoutUnfilteredValueLabelCell = $(
        '<td>',
        {
          'class': 'socrata-flyout-cell'
        }
      ).text(payload.unfilteredValueLabel);

      flyoutUnfilteredValueCell = $(
        '<td>',
        {
          'class': 'socrata-flyout-cell'
        }
      ).text(payload.unfilteredValue);

      flyoutUnfilteredValueRow = $(
        '<tr>',
        {
          'class': 'socrata-flyout-row'
        }
      ).append([
        flyoutUnfilteredValueLabelCell,
        flyoutUnfilteredValueCell
      ]);

      flyoutElements.push(flyoutUnfilteredValueRow);

      // If we are showing filtered data, then
      // show the filtered data on the flyout.
      if (payload.hasOwnProperty('filteredValue')) {

        filteredRowClass = (payload.selected) ?
          'socrata-flyout-cell is-selected' :
          'socrata-flyout-cell emphasis';

        // 'Filtered: XXX rows'
        flyoutFilteredValueLabelCell = $(
          '<td>',
          {
            'class': filteredRowClass
          }
        ).text(payload.filteredValueLabel);

        flyoutFilteredValueCell = $(
          '<td>',
          {
            'class': filteredRowClass
          }
        ).text(payload.filteredValue);

        flyoutFilteredValueRow = $(
          '<tr>',
          {
            'class': 'socrata-flyout-row'
          }
        ).append([
          flyoutFilteredValueLabelCell,
          flyoutFilteredValueCell
        ]);

        flyoutElements.push(flyoutFilteredValueRow);
      }

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
        title: payload.title,
        filtered: payload.filteredValue,
        unfiltered: payload.unfilteredValue,
        rightSideHint: false,
        belowTarget: false
      };
    }

    // Dispatch new event for example
    emitFlyoutEvent(flyoutPayload);
  }

  function showLegendFlyout(payload) {
    var flyoutContent = '<div class="flyout-title">{0}</div>'.format(payload.title);

    // Assemble payload
    var flyoutPayload = {
      element: payload.element,
      content: flyoutContent,
      dark: true,
      rightSideHint: false,
      belowTarget: false
    };

    // Dispatch new event for example
    emitFlyoutEvent(flyoutPayload);
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

    // TODO: Remove the dispatch of the '...CHOROPLETH_MAP_FLYOUT' event once
    // DataLens is using the new standardized 'SOCRATA_VISUALIZATION_FLYOUT'
    // event.
    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_CHOROPLETH_MAP_FLYOUT',
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

  return this;
};

module.exports = $.fn.socrataChoroplethMap;
