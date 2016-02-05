var _ = require('lodash');
var $ = require('jquery');
var utils = require('socrata-utils');
var ChoroplethMap = require('./views/ChoroplethMap');
var MetadataProvider = require('./dataProviders/MetadataProvider');
var GeospaceDataProvider = require('./dataProviders/GeospaceDataProvider');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');

var DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png';
var DEFAULT_BASE_LAYER_OPACITY = 0.8;
var NAME_ALIAS = '__NAME_ALIAS__';
var VALUE_ALIAS = '__VALUE_ALIAS__';
var BASE_QUERY = 'SELECT `{0}` AS {1}, COUNT(*) AS {2} {3} GROUP BY `{0}` ORDER BY COUNT(*) DESC NULL LAST LIMIT 200';
var WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata Choropleth Visualization from the
 * `socrata-visualizations` package.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataChoroplethMap = function(vif) {

  // Verify important properties got passed in
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
    'computedColumnName',
    'localization',
    'shapefile'
  );

  utils.assertHasProperties(
    vif.configuration.localization,
    'NO_VALUE',
    'FLYOUT_UNFILTERED_AMOUNT_LABEL',
    'FLYOUT_FILTERED_AMOUNT_LABEL',
    'FLYOUT_SELECTED_NOTICE'
  );

  utils.assertHasProperties(
    vif.configuration.shapefile,
    'geometryLabel',
    'primaryKey',
    'uid'
  );

  /**
   * Setup visualization
   */
  var $element = $(this);

  var visualization = new ChoroplethMap($element, vif);

  // Setup Data Providers
  var shapefileMetadataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.configuration.shapefile.uid
  };

  var shapefileMetadataProvider = new MetadataProvider(
    shapefileMetadataProviderConfig
  );

  var datasetGeospaceDataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.datasetUid
  };

  var datasetGeospaceDataProvider = new GeospaceDataProvider(
    datasetGeospaceDataProviderConfig
  );

  var shapefileGeospaceDataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.configuration.shapefile.uid
  };

  var shapefileGeospaceDataProvider = new GeospaceDataProvider(
    shapefileGeospaceDataProviderConfig
  );

  var soqlDataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.datasetUid
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

  _attachEvents();

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
      getPhidippidesAugmentedDatasetMetadata().
      then(
        function(shapefileMetadata) {
          return shapefileMetadata;
        },
        function(error) {
          _logError(error);

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
    getFeatureExtent(vif.columnName).
    // If the request has succeeded, return the response (using _.identity());
    // if it failed then log the resulting error.
    then(
      _.identity,
      _logError
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
            visualization.updateTileLayer(_getRenderOptions(vif));
            // Finally, make the data queries and prepare to draw the choropleth
            // regions.
            _updateData(vif);
          },
          function(error) {
            _logError(error);
          }
        );
      }
    );

  function _getRenderOptions(vifToRender) {

    return {
      baseLayer: {
        url: vif.configuration.baseLayerUrl || DEFAULT_BASE_LAYER_URL,
        opacity: vif.configuration.baseLayerOpacity || DEFAULT_BASE_LAYER_OPACITY
      },
      showFiltered: vifToRender.filters.length > 0
    };
  }

  /**
   * Fetches SOQL data and aggregates with shapefile geoJSON
   */
  function _updateData(vifToRender) {
    var whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(vifToRender);
    var unfilteredQueryString = BASE_QUERY.format(
      vifToRender.configuration.computedColumnName,
      NAME_ALIAS,
      VALUE_ALIAS,
      ''
    );
    var filteredQueryString = BASE_QUERY.format(
      vifToRender.configuration.computedColumnName,
      NAME_ALIAS,
      VALUE_ALIAS,
      (whereClauseComponents) ? 'WHERE {0}'.format(whereClauseComponents) : ''
    );
    var unfilteredSoqlQuery = unfilteredSoqlDataProvider.
      query(unfilteredQueryString, NAME_ALIAS, VALUE_ALIAS)
      ['catch'](function(error) {
        _logError(error);
        visualization.renderError();
      });
    var filteredSoqlQuery = filteredSoqlDataProvider.
      query(filteredQueryString, NAME_ALIAS, VALUE_ALIAS)
      ['catch'](function(error) {
        _logError(error);
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
        var aggregatedData = _aggregateGeoJsonData(
          cachedGeometryLabel,
          vifToRender.configuration.shapefile.primaryKey,
          cachedShapefile,
          unfilteredQueryResponse,
          filteredQueryResponse,
          vifToRender
        );

        visualization.render(
          aggregatedData,
          _.merge(_getRenderOptions(vifToRender), {vif: vifToRender})
        );
      })
      ['catch'](function(error) {
        _logError(error);
        visualization.renderError();
      });
  }

  /**
   * Data Formatting Functions
   */

  /**
   * See CardVisualizationChoroplethHelpers.js in the frontend repo for more
   * details about _aggregateGeoJsonData
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
   * @return {Object} (See _mergeRegionAndAggregateData)
   */
  function _aggregateGeoJsonData(
    geometryLabel,
    primaryKey,
    geojsonRegions,
    unfilteredData,
    filteredData,
    vifToRender) {

    var unfilteredDataAsHash = _.mapValues(_.indexBy(unfilteredData, 'name'), 'value');
    var filteredDataAsHash = _.mapValues(_.indexBy(filteredData, 'name'), 'value');
    var ownFilterOperands = vifToRender.
      filters.
      filter(
        function(filter) {

          return (
            (filter.columnName === vifToRender.columnName) &&
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

    return _mergeRegionAndAggregateData(
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
   * details about _mergeRegionAndAggregateData
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
  function _mergeRegionAndAggregateData(
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
        properties[vif.configuration.shapefile.columns.selected] = _.contains(ownFilterOperands, name);

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
  function _attachEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      clearTimeout(rerenderOnResizeTimeout);
      visualization.destroy();
      _detachEvents();
    });

    $(window).on('resize', _handleWindowResize);

    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_FEATURE_FLYOUT', _handleFeatureFlyout);
    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_LEGEND_FLYOUT', _handleLegendFlyout);
    $element.on('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_HIDE', _hideFlyout);
    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
  }

  function _detachEvents() {

    $(window).off('resize', _handleWindowResize);

    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_FEATURE_FLYOUT', _handleFeatureFlyout);
    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_LEGEND_FLYOUT', _handleLegendFlyout);
    $element.off('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_HIDE', _hideFlyout);
    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
  }

  function _handleWindowResize() {

    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      visualization.invalidateSize,
      // Add some jitter in order to make sure multiple visualizations are
      // unlikely to all attempt to rerender themselves at the exact same
      // moment.
      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
    );
  }

  function _handleFeatureFlyout(event) {
    var payload = event.originalEvent.detail;
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
        rightSideHint: false,
        belowTarget: false
      };
    }

    // Dispatch new event for example
    _dispatchFlyout(flyoutPayload);
  }

  function _handleLegendFlyout(event) {

    var payload = event.originalEvent.detail;
    var flyoutContent = '<div class="flyout-title">{0}</div>'.format(payload.title);

    // Assemble payload
    var flyoutPayload = {
      element: payload.element,
      content: flyoutContent,
      rightSideHint: false,
      belowTarget: false
    };

    // Dispatch new event for example
    _dispatchFlyout(flyoutPayload);
  }

  function _hideFlyout() {

    _dispatchFlyout(null);
  }

  function _dispatchFlyout(payload) {

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT_EVENT',
        {
          detail: payload,
          bubbles: true
        }
      )
    );
  }

  function _logError(error) {
    if (window.console && window.console.error) {
      console.error(error);
    }
  }

  return this;
};

module.exports = $.fn.socrataChoroplethMap;
