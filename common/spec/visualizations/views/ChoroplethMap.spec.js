import _ from 'lodash';
import $ from 'jquery';
import chroma from 'chroma-js';
import choroplethTestData from '../choroplethTestData/choroplethTestData';
import ChoroplethMap from 'common/visualizations/views/ChoroplethMap';
import testHelpers from '../testHelpers';

describe('ChoroplethMap', function() {

  'use strict';

  // Indices into an rgb array, for greater semantics!
  var RED = 0;
  var GREEN = 1;
  var BLUE = 2;

  var choroplethVIF = {
    aggregation: {
      columnName: null,
      'function': 'count'
    },
    configuration: {
      baseLayerUrl: DEFAULT_BASE_LAYER_URL,
      baseLayerOpacity: DEFAULT_BASE_LAYER_OPACITY,
      defaultExtent : {
        southwest: [41.45919537950706, -90.24169921875],
        northeast: [42.20817645934742, -85.242919921875]
      },
      interactive: true,
      legend: {
        type: 'discrete'
      },
      localization: {
        'flyout_selected_notice': 'The page is currently filtered by this value, click to clear it',
        'flyout_unfiltered_amount_label': 'Total',
        'flyout_filtered_amount_label': 'Filtered',
        'no_value': '(No Value)',
        'clear_filter_label': 'Clear filter',
        'flyout_locate_user_error_title': 'There was an error determining your location',
        'flyout_locate_user_error_notice': 'Click to try again',
        'user_current_position': 'Your current location (estimated)'
      },
      shapefile: {
        columns: {
          unfiltered: '__SOCRATA_UNFILTERED_VALUE__',
          filtered: '__SOCRATA_FILTERED_VALUE__',
          selected: '__SOCRATA_SELECTED_VALUE__',
          name: '__SOCRATA_HUMAN_READABLE_NAME__'
        },
        primaryKey: 'primaryKey'
      },
      savedExtent: {
        southwest: [41.42625319507272, -88.5662841796875],
        northeast: [42.24478535602799, -86.9183349609375]
      }
    },
    type: 'choroplethMap',
    unit: {
      one: 'row',
      other: 'rows'
    }
  };

  var DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png';
  var DEFAULT_BASE_LAYER_OPACITY = 0.8;

  var rootScope;
  var testData;

  var legendSelector = '.choropleth-legend';
  var legendColorSelector = legendSelector + ' .choropleth-legend-color';
  var featureGeometrySelector = '.leaflet-map-pane .leaflet-objects-pane .leaflet-overlay-pane svg path';
  var flyoutSelector = '#uber-flyout';
  var featureMergedValueName = choroplethVIF.configuration.shapefile.columns.filtered;

  // NOTE! We mock out the clock.
  // This is done because we handle double-clicking features manually
  var fakeClock = null;

  function dataFeatureValues(geojsonAggregateData) {
    return _.map(geojsonAggregateData.features, function(feature) {
      return Number(feature.properties[featureMergedValueName]);
    });
  }

  function legendFlyoutValues(el) {
    return _.map(el.find(legendColorSelector), function(el, i) {
      var text = $(el).data('flyout-text');
      var num = Number(text);
      if (!num) {
        var numTexts = text.split(' ');
        num = i == 0 ? Number(numTexts[0]) : Number(numTexts[2]);
      }
      return num;
    });
  }

  function createChoroplethMap(data, legendType) {

    choroplethVIF.configuration.legend.type = legendType || 'discrete';

    if (_.isUndefined(data)) {
      data = testData.polygonData2;
    }

    var $element = $(
      '<div>',
      {
        'id': 'choropleth'
      }
    );

    $element.height(480);
    $element.find('.choropleth-container').height(480);

    $('body').append($element);

    var visualizationRenderOptions = {
      baseLayer: {
        url: DEFAULT_BASE_LAYER_URL,
        opacity: DEFAULT_BASE_LAYER_OPACITY
      },
      vif: {
        configuration: {
          shapefile: {
            primaryKey: 'primaryKey'
          }
        }
      }
    };

    var visualization = new ChoroplethMap($element, choroplethVIF);
    visualization.updateTileLayer(visualizationRenderOptions);
    visualization.render(data, visualizationRenderOptions);

    // Choropleth has "interesting" double-click detection, so we need to
    // manipulate time to get it to register clicks correctly
    fakeClock.tick(500);

    return {
      element: $element,
      visualization: visualization,
      options: visualizationRenderOptions,
      data: data
    };
  }

  /**
   * @param {Number[]} rgb the rgb value to test.
   * @returns true if the given color is red. Otherwise, falsey.
   */
  function isRed(rgb) {
    return rgb[RED] > rgb[GREEN] &&
      rgb[RED] > rgb[BLUE];
  }

  /**
   * @param {Number[]} rgb the rgb value to test.
   * @returns true if the given color is blue. Otherwise, falsey.
   */
  function isBlue(rgb) {
    return rgb[BLUE] > rgb[GREEN] &&
      rgb[BLUE] > rgb[RED];
  }

  /**
   * @param {Number[]} rgb the rgb value to test.
   * @returns true if the given color is a shade of gray. Otherwise, falsey.
   */
  function isGray(rgb) {
    return rgb[BLUE] === rgb[GREEN] &&
      rgb[BLUE] === rgb[RED];
  }

  /**
   * Create a geojson data object that simulates the structure our server returns.
   *
   * @param {Number} featurecount - The number of features to create.
   * @return {Object} a geojson object similar to what our server gives us.
   */
  function createGeoJsonData(featurecount) {
    var basePoint = [121.5505, 23.9772];
    var boxWidth = Math.floor(Math.sqrt(featurecount));
    return {
      type: 'FeatureCollection',
      features: _.map(_.range(featurecount), function(i) {
        var properties = {};
        properties.primaryKey = '' + i;
        var increment = .01;
        var dx = increment * (i % boxWidth);
        var dy = increment * (Math.floor(i / boxWidth));
        var x0 = basePoint[0] + dx;
        var y0 = basePoint[1] + dy;

        return {
          type: 'Feature',
          properties: properties,
          geometry: {
            type: 'Polygon',
            coordinates: [[
              // make nice parallelograms
              [x0, y0],
              [x0 + increment / 3, y0 + increment],
              [x0 + increment * 4 / 3, y0 + increment],
              [x0 + increment, y0]
            ]]
          }
        };
      }),
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }
    };
  }

  /**
   * Convenience function to massage the given values into something geojsonAggregateData expects.
   *
   * @param {Number[]} values - The values to graph.
   * @return {Object} a geojson object, with features that contain aggregate values.
   */
  function aggregateDataForValues(values) {
    return _aggregateGeoJsonData(
      'geometryLabel',
      'primaryKey',
      createGeoJsonData(values.length),
      values,
      values,
      { filters: [] }
    );
  }

  // Duplicated from SocrataChoroplethMap
  function _aggregateGeoJsonData(
    geometryLabel,
    primaryKey,
    geojsonRegions,
    unfilteredData,
    filteredData,
    vifToRender) {

    var unfilteredDataAsHash = _.mapValues(_.keyBy(unfilteredData, 'name'), 'value');
    var filteredDataAsHash = _.mapValues(_.keyBy(filteredData, 'name'), 'value');
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

  // Duplicated from SocrataChoroplethMap
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
        properties[choroplethVIF.configuration.shapefile.columns.name] = humanReadableName;
        properties[choroplethVIF.configuration.shapefile.columns.filtered] = filteredDataAsHash[name] || null;
        properties[choroplethVIF.configuration.shapefile.columns.unfiltered] = unfilteredDataAsHash[name];
        properties[choroplethVIF.configuration.shapefile.columns.selected] = _.includes(ownFilterOperands, name);

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
   * Tests begin here
   */
  beforeEach(function() {
    testData = choroplethTestData;

    if (typeof document.body.click !== 'function') {
      document.body.click = function() {};
    }

    fakeClock = sinon.useFakeTimers();
  });

  afterEach(function() {

    if (fakeClock) {
      fakeClock.restore();
      fakeClock = null;
    }

    $('#choropleth').remove();
  });


  describe('with a valid geojsonAggregateData input', function() {

    describe('render timing events', function() {

      it('should emit render start and complete events on rendering', function(done) {

        var geojsonAggregateData = testData.lineStringData2;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;
        var visualization = choroplethObject.visualization;
        var options = choroplethObject.options;
        var data = choroplethObject.data;

        var startTime;

        const doneAfterBoth = _.after(2, done);

        el.on('SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_START', function(e) {

          var payload = e.originalEvent.detail;
          startTime = payload.timestamp;

          expect(startTime).to.satisfy(_.isFinite);

          fakeClock.tick(50);
          doneAfterBoth();
        });

        el.on('SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_COMPLETE', function(e) {

          var payload = e.originalEvent.detail;
          var endTime = payload.timestamp;

          expect(endTime).to.satisfy(_.isFinite);
          expect(startTime).to.be.below(endTime);

          doneAfterBoth();
        });

        visualization.render(data, options);
      });
    });

    it('should render a leaflet map, with zoom controls', function() {

      var geojsonAggregateData = testData.lineStringData2;

      var choroplethObject = createChoroplethMap(geojsonAggregateData);
      var el = choroplethObject.element;

      expect(el.find('.choropleth-map-container').length).to.equal(1);
      expect(el.find('.leaflet-map-pane').length).to.equal(1);
    });

    describe('base layer', function() {

      it('should update tiles', function() {

        var geojsonAggregateData = testData.lineStringData2;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;
        var visualization = choroplethObject.visualization;

        var originalBaseLayerUrl = el.find('.leaflet-tile')[0].src;

        var renderOptions = {
          baseLayer: {
            url: 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png',
            opacity: DEFAULT_BASE_LAYER_OPACITY
          }
        };

        visualization.updateTileLayer(renderOptions);

        expect(el.find('.leaflet-tile')[0].src).to.not.equal(originalBaseLayerUrl);
      });
    });

    describe('shapes', function() {

      it('should render Polygons on the map, if the geojson contains Polygons', function() {

        var geojsonAggregateData = testData.polygonData3;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        expect(el.find(featureGeometrySelector).length).to.equal(3);
      });

      it('should render MultiPolygons on the map, if the geojson contains MultiPolygons', function() {

        var geojsonAggregateData = testData.multiPolygonData2;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        expect(el.find(featureGeometrySelector).length).to.equal(2 + 3);
      });

      it('should render MultiLineStrings on the map, if the geojson contains MultiLineStrings', function() {

        var geojsonAggregateData = testData.multiLineStringData4;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        expect(el.find(featureGeometrySelector).length).to.equal(12 + 15 + 6 + 3);
      });

      it('should render LineStrings on the map, if the geojson contains LineStrings', function() {

        var geojsonAggregateData = testData.lineStringData7;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        expect(el.find(featureGeometrySelector).length).to.equal(7);
      });
    });

    describe('value display', function() {

      it('should be able to render a legend if the choropleth has values', function() {

        var geojsonAggregateData = testData.multiLineStringData4;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        expect(el.find(legendSelector).length).to.equal(1);
      });

      it('should not render a legend if the choropleth has no values', function() {

        var geojsonAggregateData = testData.polygonData2NoValues;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        // These rects are added by the legend render code - they won't be there
        // unless that code creates them.
        expect(el.find(legendSelector).find('rect').children().length).to.equal(0);
      });

      it('should render proper map features, legend, and legend labels for 1 line feature', function() {

        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var geojsonAggregateData = testData.lineStringData1;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        // there should only be 1 feature
        expect(el.find(featureGeometrySelector).length).to.equal(1);

        // there should only be 1 legend
        expect(el.find(legendSelector).length).to.equal(1);

        // there should only be 1 color in the legend
        expect(el.find(legendColorSelector).length).to.equal(1);

        // legend label should match feature value
        expect(legendFlyoutValues(el)).to.deep.equal(dataFeatureValues(geojsonAggregateData));

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hex(es) should match legend color hex(es)
        var fillColor = el.find(featureGeometrySelector).css('stroke');
        var legendColor = el.find(legendColorSelector).css('fill');

        expect(chroma.color(fillColor).hex()).to.equal(chroma.color(legendColor).hex());
      });

      it('should render proper map features, legend, and legend labels for 1 polygon feature', function() {

        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var geojsonAggregateData = testData.polygonData1;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        // there should only be 1 feature
        expect(el.find(featureGeometrySelector).length).to.equal(1);

        // there should only be 1 legend
        expect(el.find(legendSelector).length).to.equal(1);

        // there should only be 1 color in the legend
        expect(el.find(legendColorSelector).length).to.equal(1);

        // legend label should match feature value
        expect(legendFlyoutValues(el)).to.deep.equal(dataFeatureValues(geojsonAggregateData));

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hex(es) should match legend color hex(es)
        var fillColor = el.find(featureGeometrySelector).css('fill');
        var legendColor = el.find(legendColorSelector).css('fill');
        expect(chroma.color(fillColor).hex()).to.equal(chroma.color(legendColor).hex());
      });

      it('should render proper map features, legend, and legend labels for 2 features', function() {

        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var geojsonAggregateData = testData.polygonData2;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // there should only be 1 legend
        expect(el.find(legendSelector).length).to.equal(1);

        // there should only be 2 or more colors in the legend
        expect(el.find(legendColorSelector).length).to.be.above(1);

        // legend labels should contain feature values
        var featureValues = dataFeatureValues(geojsonAggregateData);
        expect(_.intersection(legendFlyoutValues(el), featureValues).length).to.equal(featureValues.length);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
          var fillColor = $(el).css('fill');
          return chroma.color(fillColor).hex();
        });
        var legendColors = _.map(el.find(legendColorSelector), function(el) {
          var legendColor = $(el).css('fill');
          return chroma.color(legendColor).hex();
        });

        expect(_.intersection(legendColors, fillColors).length).to.equal(fillColors.length);
      });

      it('should render proper map features, legend, and legend labels for 3 features', function() {

        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var geojsonAggregateData = testData.lineStringData3;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        // there should only be 3 features
        expect(el.find(featureGeometrySelector).length).to.equal(3);

        // there should only be 1 legend
        expect(el.find(legendSelector).length).to.equal(1);

        // there should only be 3 or more colors in the legend
        expect(el.find(legendColorSelector).length).to.be.above(2);

        // legend labels should contain feature values
        var featureValues = dataFeatureValues(geojsonAggregateData);
        expect(_.intersection(legendFlyoutValues(el), featureValues).length).to.equal(featureValues.length);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
          var fillColor = $(el).css('stroke');
          return chroma.color(fillColor).hex();
        });
        var legendColors = _.map(el.find(legendColorSelector), function(el) {
          var legendColor = $(el).css('fill');
          return chroma.color(legendColor).hex();
        });

        expect(_.intersection(legendColors, fillColors).length).to.equal(fillColors.length);
      });

      it('should render proper map features, legend, and legend labels for many features', function() {
        var geojsonAggregateData = testData.lineStringData52;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        // there should only be 52 features
        expect(el.find(featureGeometrySelector).length).to.equal(52);

        // there should only be 1 legend
        expect(el.find(legendSelector).length).to.equal(1);

        // there should only be less than 20 colors in the legend
        expect(el.find(legendColorSelector).length < 20).to.equal(true);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
          var fillColor = $(el).css('stroke');
          return chroma.color(fillColor).hex();
        });

        var legendColors = _.map(el.find(legendColorSelector), function(el) {
          var legendColor = $(el).css('fill');
          return chroma.color(legendColor).hex();
        });

        expect(_.intersection(legendColors, fillColors).length).to.equal(legendColors.length);
      });

      describe('negative values', function() {

        /**
         * Counts the number of white, red, and blues inside the given array of colors.
         *
         * @param {chroma.Color[]} colors - The list of colors.
         *
         * @return {Object} an object with keys 'red', 'white', and 'blue', with how many of those
         *   colors were found.
         */
        function countColors(colors) {

          var whiteCount = 0;
          var redCount = 0;
          var blueCount = 0;
          _.each(colors, function(color) {
            var rgb = color.rgb();
            if (isGray(rgb)) {
              whiteCount++;
            } else {
              if (isRed(rgb)) {
                redCount++;
              } else if (isBlue(rgb)) {
                blueCount++;
              } else {
                assert.fail(rgb, 'Unexpected legend color - should be either red, white, or blue.');
              }
            }
          });

          return {
            white: whiteCount,
            red: redCount,
            blue: blueCount
          };
        }

        it('colors red-orange scale for all negative values', function() {

          var featureCount = 11;
          var values = _.map(_.range(-featureCount, 0), function(value, i) {
            return { name: '' + i, value: value };
          });
          var geojsonAggregateData = aggregateDataForValues(values);

          var choroplethObject = createChoroplethMap(geojsonAggregateData);
          var el = choroplethObject.element;

          // the normal stuff should still be there
          expect(el.find(featureGeometrySelector).length).to.equal(featureCount);
          expect(el.find(legendSelector).length).to.equal(1);

          // Both the regions and the legend should be reddish
          var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
            var fillColor = $(el).css('fill');
            return chroma.color(fillColor);
          });

          var legendColors = _.map(el.find(legendColorSelector), function(el) {
            var legendColor = $(el).css('fill');
            return chroma.color(legendColor);
          });

          expect(fillColors.length).to.be.greaterThan(2);
          expect(legendColors.length).to.be.greaterThan(2);

          // Assert that they're reddish
          var fillColorCount = countColors(fillColors);
          expect(fillColorCount.red).to.be.greaterThan(0);
          expect(fillColorCount.blue).to.equal(0);

          // But there shouldn't be _too_ many white values.
          expect(fillColorCount.white).to.be.lessThan(2);

          var legendColorCount = countColors(legendColors);
          expect(legendColorCount.red).to.be.greaterThan(0);
          expect(legendColorCount.blue).to.equal(0);

          // But there shouldn't be _too_ many white values.
          expect(legendColorCount.white).to.be.lessThan(2);
        });

        it('colors red-orange - white - blue for range of values straddling 0', function() {

          var featureCount = 11;
          var start = -Math.floor(featureCount / 2);
          var values = _.map(_.range(start, start + featureCount), function(value, i) {
            return { name: '' + i, value: value };
          });
          var geojsonAggregateData = aggregateDataForValues(values);

          var choroplethObject = createChoroplethMap(geojsonAggregateData);
          var el = choroplethObject.element;

          // the normal stuff should still be there
          expect(el.find(featureGeometrySelector).length).to.equal(featureCount);
          expect(el.find(legendSelector).length).to.equal(1);

          // Both the regions and the legend should have red / white / blue
          var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
            var fillColor = $(el).css('fill');
            return chroma.color(fillColor);
          });

          var legendColors = _.map(el.find(legendColorSelector), function(el) {
            var legendColor = $(el).css('fill');
            return chroma.color(legendColor);
          });

          expect(fillColors.length).to.be.greaterThan(2);
          expect(legendColors.length).to.be.greaterThan(2);

          // First the legend colors

          // Assert that they're red / white / blue
          var colorCount = countColors(legendColors);

          // There should be at most one white value in the legend.
          expect(colorCount.white).to.be.lessThan(2);
          // There should be blue and red regions too
          expect(colorCount.blue).to.be.greaterThan(0);
          expect(colorCount.red).to.be.greaterThan(0);

          // Now check the fill colors
          colorCount = countColors(fillColors);

          // There should be at least one white value in the regions of this particular dataset.
          expect(colorCount.white).to.be.greaterThan(0);
          // But there shouldn't be _too_ many of them. Assert that less than half the (regions +
          // legend steps) are white.
          expect(colorCount.white).to.be.lessThan(featureCount / 2);
          // There should be blue and red regions too
          expect(colorCount.blue).to.be.greaterThan(0);
          expect(colorCount.red).to.be.greaterThan(0);
        });

        describe('always includes a 0 label for', function() {

          var X_OFFSET_SCALING_VALUE = 0.23;

          // Run test 3 times with random counts (ie number of features) between 3 and 103
          _.each([3, 50, 103], function(featureCount) {
            it('{0} features'.format(featureCount), function() {

              var start = -Math.floor(featureCount / 3);
              var values = _.map(_.range(start, start + featureCount), function(value, i) {
                var xOffset = X_OFFSET_SCALING_VALUE * start;
                var yOffset = -featureCount / 3;
                var y = yOffset + Math.pow(value - xOffset, 2);
                return { name: '' + i, value: Math.round(featureCount % 2 ? y : -y) };
              });
              var geojsonAggregateData = aggregateDataForValues(values);

              var choroplethObject = createChoroplethMap(geojsonAggregateData);
              var el = choroplethObject.element;

              var legend = el.find(legendSelector);
              var ticks = legend.find('.labels .tick');
              var foundZero = _.reduce(ticks.toArray(), function(found, tick) {
                return /^0(\.0)?$/.test($(tick).text()) || found;
              }, false);
              expect(foundZero).to.equal(true);
            });
          });
        });

        it('does something sane for outliers', function() {

          var featureCount = 50;
          // One large-magnitude, negative number
          var values = [{ name: '0', value: -5000 }].concat(
            // A whole bunch of positive numbers with small magnitude
            _.map(_.range(1, featureCount), function(value, i) {
              return { name: '' + value, value: value / 100 };
            })
          );
          var geojsonAggregateData = aggregateDataForValues(values);

          var choroplethObject = createChoroplethMap(geojsonAggregateData);
          var el = choroplethObject.element;

          // Check both the regions and the legend
          var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
            var fillColor = $(el).css('fill');
            return chroma.color(fillColor);
          });

          var legendColors = _.map(el.find(legendColorSelector), function(el) {
            var legendColor = $(el).css('fill');
            return {
              color: chroma.color(legendColor),
              // The blue bars are height=0, so they can't be seen
              height: parseInt(el.getAttribute('height'), 10)
            };
          });

          expect(fillColors.length).to.be.greaterThan(3);
          expect(legendColors.length).to.be.greaterThan(0);

          // The legend should be mostly red
          var colors = _.groupBy(legendColors, function(obj) {
            var rgb = obj.color.rgb();
            if (isRed(rgb)) {
              return 'red';
            } else if (isBlue(rgb)) {
              return 'blue';
            }
            return 'neither';
          });
          expect(colors.neither).to.be.falsy;
          var blueHeight = _.reduce(colors.blue, function(sum, obj) {
            return sum + obj.height;
          }, 0);
          var redHeight = _.reduce(colors.red, function(sum, obj) {
            return sum + obj.height;
          }, 0);
          expect(redHeight).to.be.greaterThan(blueHeight);
          // The features should be mostly blue
          var featureColorCount = countColors(fillColors);
          expect(featureColorCount.blue).to.be.greaterThan(featureColorCount.red);
        });
      });
    });

    describe('feature colors', function() {

      it('should not color features that are missing properties', function() {

        var geojsonAggregateData = testData.polygonData2PropertyMissing;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // there should only be 1 legend with 1 color
        expect(el.find(legendSelector).length).to.equal(1);
        expect(el.find(legendColorSelector).length).to.equal(1);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
          var color = $(el).css('fill');
          return chroma.color(color).hex();
        });
        var nullColors = _.filter(fillColors, function(fc) { return chroma.color(fc).hex() == '#dddddd'; });

        expect(nullColors.length).to.equal(1);
      });

      it('should not color features that have null values', function() {

        var geojsonAggregateData = testData.polygonData2ValueNull;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // there should only be 1 legend with 1 color
        expect(el.find(legendSelector).length).to.equal(1);
        expect(el.find(legendColorSelector).length).to.equal(1);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
          var color = $(el).css('fill');
          return chroma.color(color).hex();
        });
        var nullColors = _.filter(fillColors, function(fc) { return chroma.color(fc).hex() == '#dddddd'; });
        expect(nullColors.length).to.equal(1);
      });

      it('should not color features that have undefined values', function() {

        var geojsonAggregateData = testData.polygonData2ValueUndefined;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // there should only be 1 legend with 1 color
        expect(el.find(legendSelector).length).to.equal(1);
        expect(el.find(legendColorSelector).length).to.equal(1);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
          var color = $(el).css('fill');
          return chroma.color(color).hex();
        });
        var nullColors = _.filter(fillColors, function(fc) { return chroma.color(fc).hex() == '#dddddd'; });
        expect(nullColors.length).to.equal(1);
      });

      describe('1-2 values', function() {

        describe('discrete legend', function() {

          // We want to test both datasets with only one row, as well as multiple rows with the same
          // value. They should display the same on the legend.
          _.each(_.range(1, 3), function(valueCount) {
            var values = _.map(_.range(0, valueCount), function(i) {
              return { name: '' + i, value: 100 };
            });

            it('colors datasets blue with {0} rows, 1 unique positive value'.format(valueCount), function() {

              var geojsonAggregateData = aggregateDataForValues(values);

              var choroplethObject = createChoroplethMap(geojsonAggregateData);
              var el = choroplethObject.element;

              // Both the region and the legend should be blueish
              _.each([featureGeometrySelector, legendColorSelector], function(selector) {
                var element = el.find(selector);
                expect(element.length).to.be.greaterThan(0);
                element.each(function() {
                  var elementColor = chroma.color($(this).css('fill')).rgb();
                  expect(isBlue(elementColor)).to.equal(true);
                });
              });
            });
          });

          _.each(_.range(1, 3), function(valueCount) {
            var values = _.map(_.range(0, valueCount), function(i) {
              return { name: '' + i, value: -128 };
            });

            it('colors red datasets {0} rows, 1 unique negative value'.format(valueCount), function() {

              var geojsonAggregateData = aggregateDataForValues(values);

              var choroplethObject = createChoroplethMap(geojsonAggregateData);
              var el = choroplethObject.element;

              // Both the region and the legend should be reddish
              _.each([featureGeometrySelector, legendColorSelector], function(selector) {
                var element = el.find(selector);
                expect(element.length).to.be.greaterThan(0);
                element.each(function() {
                  var elementColor = chroma.color($(this).css('fill')).rgb();
                  expect(isRed(elementColor)).to.equal(true);
                });
              });
            });
          });

          _.each(_.range(1, 3), function(valueCount) {
            var values = _.map(_.range(0, valueCount), function(i) {
              return { name: '' + i, value: 0 };
            });

            it('colors white datasets with {0} rows, 1 value = 0'.format(valueCount), function() {

              var geojsonAggregateData = aggregateDataForValues(values);

              var choroplethObject = createChoroplethMap(geojsonAggregateData);
              var el = choroplethObject.element;

              // Both the region and the legend should be whiteish
              _.each([featureGeometrySelector, legendColorSelector], function(selector) {
                var element = el.find(selector);
                expect(element.length).to.be.greaterThan(0);
                element.each(function() {
                  var elementColor = chroma.color($(this).css('fill')).rgb();
                  expect(isGray(elementColor)).to.equal(true);
                });
              });
            });
          });

          it('colors blue datasets with only two positive values', function() {

            var values = _.map(_.range(5, 100, 90), function(v, i) { return { name: '' + i, value: v }; });
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData);
            var el = choroplethObject.element;

            // Both the region and the legend should be blueish
            _.each([featureGeometrySelector, legendColorSelector], function(selector) {
              var element = el.find(selector);
              expect(element.length).to.equal(2);
              element.each(function() {
                var elementColor = chroma.color($(this).css('fill')).rgb();
                expect(isBlue(elementColor)).to.equal(true);
              });
            });

            // Should have two-ish ticks, labelling the two values
            var legend = el.find(legendSelector).find('.tick');
            expect(legend.length).to.be.closeTo(3, 1);
          });

          it('colors red datasets with only two negative values', function() {

            var values = _.map(_.range(-100, -5, 90), function(v, i) { return { name: '' + i, value: v }; });
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData);
            var el = choroplethObject.element;

            // Both the region and the legend should be reddish
            _.each([featureGeometrySelector, legendColorSelector], function(selector) {
              var element = el.find(selector);
              expect(element.length).to.equal(2);
              element.each(function() {
                var elementColor = chroma.color($(this).css('fill')).rgb();
                expect(isRed(elementColor)).to.equal(true);
              });
            });

            // Should have two-ish ticks, labelling the two values
            var legend = el.find(legendSelector).find('.tick');
            expect(legend.length).to.be.closeTo(3, 1);
          });

          it('colors blue/red datasets with two values straddling 0', function() {

            var values = _.map(_.range(-50, 50, 90), function(v, i) { return { name: '' + i, value: v }; });
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData);
            var el = choroplethObject.element;

            // Both the region and the legend should have 1 red and 1 blue
            _.each([featureGeometrySelector, legendColorSelector], function(selector) {
              var element = el.find(selector);
              expect(element.length).to.equal(2);
              var redCount = 0;
              var blueCount = 0;
              element.each(function() {
                var elementColor = chroma.color($(this).css('fill')).rgb();
                if (isRed(elementColor)) {
                  redCount++;
                } else if (isBlue(elementColor)) {
                  blueCount++;
                }
              });
              expect(redCount).to.equal(1);
              expect(blueCount).to.equal(1);
            });

            // Should have two-ish ticks, labelling the two values
            var legend = el.find(legendSelector).find('.tick');
            expect(legend.length).to.be.closeTo(3, 1);
          });
        });

        describe('continuous legend', function() {

          it('colors blue datasets with only one positive value', function() {

            var values = [{ name: '0', value: 100 }];
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            // Both the region and the legend should be blueish
            var element = el.find(featureGeometrySelector);
            expect(element.length).to.equal(1);

            var elementColor = chroma.color(element.css('fill')).rgb();
            expect(isBlue(elementColor)).to.equal(true);

            var gradient = el.find(legendSelector).
                find('[id^=gradient]').
                find('stop[offset="100%"]');
            expect(gradient.length).to.equal(1);

            var elementColor = chroma.color(gradient.css('stop-color')).rgb();
            expect(isBlue(elementColor)).to.equal(true);
          });

          it('colors datasets red with only one negative value', function() {

            var values = [{ name: '0', value: -128 }];
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            // Both the region and the legend should be reddish
            var element = el.find(featureGeometrySelector);
            expect(element.length).to.equal(1);

            var elementColor = chroma.color(element.css('fill')).rgb();
            expect(isRed(elementColor)).to.equal(true);

            var gradient = el.find(legendSelector).
                find('[id^=gradient]').
                find('stop[offset="0%"]');
            expect(gradient.length).to.equal(1);

            var elementColor = chroma.color(gradient.css('stop-color')).rgb();
            expect(isRed(elementColor)).to.equal(true);
          });

          it('colors white datasets with only one value = 0', function() {

            var values = [{ name: '0', value: 0 }];
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            // Both the region and the legend should be white-ish
            var element = el.find(featureGeometrySelector);
            expect(element.length).to.equal(1);

            var elementColor = chroma.color(element.css('fill')).rgb();
            expect(isGray(elementColor)).to.equal(true);

            var gradient = el.find(legendSelector).
                find('[id^=gradient]').
                find('stop[offset="0%"]');
            expect(gradient.length).to.equal(1);

            var elementColor = chroma.color(gradient.css('stop-color')).rgb();
            expect(isGray(elementColor)).to.equal(true);
          });

          it('does not render if no data is present', function() {
            var geojsonAggregateData = testData.polygonData2NoValues;

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            expect(el.find(legendSelector).find('rect').children().length).to.equal(0);
            expect(el.find(legendSelector).find('g.tick').children().length).to.equal(0);
          });
        });
      });
    });

    describe('double-click effects', function() {

      it('should zoom the map if a map tile was double clicked', function() {

        var geojsonAggregateData = testData.polygonData2ValueUndefined;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        var zoomStartSpy = sinon.spy();
        var zoomEndSpy = sinon.spy();

        el.on('zoomstart', zoomStartSpy);
        el.on('zoomend', zoomEndSpy);

        testHelpers.fireMouseEvent(el.find('.leaflet-tile')[0], 'dblclick');

        expect(zoomStartSpy).to.have.been.called;
        expect(zoomEndSpy).to.have.been.called;
      });

      it('should not select a feature that was double clicked', function(done) {

        var geojsonAggregateData = testData.polygonData2ValueUndefined;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        el.on('SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION', function(e) {

          // Sanity check that this doesn't happen on feature double click
          expect(false).to.equal(true);
        });

        var polygon = el.find('path')[0];
        testHelpers.fireMouseEvent(polygon, 'click');
        fakeClock.tick(50);
        testHelpers.fireMouseEvent(polygon, 'click');

        done();
      });

      it('should preserve the styles on a highlighted feature if the highlighted feature was double clicked', function() {

        var geojsonAggregateData = testData.polygonData2ValueUndefined;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        var polygon = el.find('path')[0];
        var defaultStrokeWidth = parseInt($(polygon).css('strokeWidth'));

        testHelpers.fireEvent(polygon, 'dblclick');

        var strokeWidth = parseInt($(polygon).css('strokeWidth'));

        expect(strokeWidth).to.equal(defaultStrokeWidth);
      });
    });

    describe('mouseover events', function() {

      it('should toggle highlight on an unfiltered region on mouseover and mouseout', function() {

        var geojsonAggregateData = testData.polygonData2ValueUndefined;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        var feature = $(el).find(featureGeometrySelector)[0];
        var defaultStrokeWidth = parseInt($(feature).css('strokeWidth'));

        testHelpers.fireEvent(feature, 'mouseover');

        testHelpers.fireEvent(feature, 'mousemove');

        // mouseover should highlight feature by increasing stroke width
        var highlightedStrokeWidth = parseInt($(feature).css('strokeWidth'));
        expect(highlightedStrokeWidth).to.be.above(defaultStrokeWidth);

        testHelpers.fireEvent(feature, 'mouseout');

        var unhighlightedStrokeWidth = parseInt($(feature).css('strokeWidth'));
        expect(unhighlightedStrokeWidth).to.equal(defaultStrokeWidth);
      });

      it('should emit events on region mouseover and mouseout', function(done) {

        var geojsonAggregateData = testData.polygonData2ValueUndefined;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        var feature = $(el).find(featureGeometrySelector)[0];
        var mouseEventCount = 0;

        el.on('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT', function(e) {

          mouseEventCount += 1;
          var payload = e.originalEvent.detail;

          if (mouseEventCount < 2) {
            expect(payload).to.not.be.undefined;
          } else {
            expect(payload).to.not.exist;
            done();
          }
        });

        testHelpers.fireEvent(feature, 'mousemove');
        testHelpers.fireEvent(feature, 'mouseout');
      });
    });

    describe('map zoom and drag events', function() {

      it('should emit an event on map zoomend/dragend', function(done) {

        var geojsonAggregateData = testData.polygonData2ValueUndefined;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        el.on('SOCRATA_VISUALIZATION_CHOROPLETH_EXTENT_CHANGE', function(e) {

          var payload = e.originalEvent.detail;

          expect(payload.hasOwnProperty('southwest')).to.be.true;
          expect(payload.hasOwnProperty('northeast')).to.be.true;
          done();
        });

        testHelpers.fireEvent(el.find('.leaflet-tile')[0], 'dblclick');
      });
    });

    describe('dimension changes', function() {

      var invalidateSizeSpy;

      beforeEach(function() {
        invalidateSizeSpy = sinon.spy(L.Map.prototype, 'invalidateSize');
      });

      afterEach(function() {
        L.Map.prototype.invalidateSize.restore();
      });

      it('should re-center map if dimensions have changed', function() {

        var geojsonAggregateData = testData.lineStringData2;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;
        var visualization = choroplethObject.visualization;

        el.find('.choropleth-container').width(10);
        visualization.invalidateSize();

        expect(invalidateSizeSpy).to.have.been.called;
      });

      it('should not re-center map if dimensions have not changed', function() {

        var geojsonAggregateData = testData.lineStringData2;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;
        var visualization = choroplethObject.visualization;

        visualization.invalidateSize();

        expect(invalidateSizeSpy).to.not.have.been.called;
      });
    });

    /* ---- FILTERING EVENTS -------------------------------- */

    describe('on clicking a region', function() {

      it('should emit an event with feature details', function(done) {

        var geojsonAggregateData = testData.polygonData2;

        var choroplethObject = createChoroplethMap(geojsonAggregateData);
        var el = choroplethObject.element;

        var polygon = el.find('path')[0];

        el.on('SOCRATA_VISUALIZATION_CHOROPLETH_SELECT_REGION', function(e) {

          var payload = e.originalEvent.detail;

          expect(payload.layer).to.not.be.undefined;
          expect(payload.feature).to.not.be.undefined;
          done();
        });

        testHelpers.fireMouseEvent(polygon, 'click');
        fakeClock.tick(200);
      });
    });

    describe('legend', function() {

      describe('discrete scale', function() {

        it('should contain labels that are evenly spaced numbers', function() {

          var geojsonAggregateData = testData.polygonData2;

          var choroplethObject = createChoroplethMap(geojsonAggregateData);
          var el = choroplethObject.element;

          var ticks = el.find(legendSelector + ' .labels .tick');
          var offsets = _.map(ticks, function(tick) {
            var translateString = $(tick).attr('transform');
            var yOffset = parseInt(translateString.replace(/translate\(\d+\D+/, ''));
            return yOffset;
          });
          // test for equidistant y offsets (check within +/- 2 px, due to floating point issues)
          var isEquidistant = _.reduce(offsets, function(difference, offset, i) {
            if (i == offsets.length - 1) {
              return difference ? true : false;
            }
            return Math.abs(difference - (offset - offsets[i + 1])) <= 2 ? difference : false;
          }, offsets[0] - offsets[1]);
          expect(isEquidistant).to.equal(true);
        });

        it('should emit an event upon hover over a legend color', function(done) {

          var geojsonAggregateData = testData.polygonData2;

          var choroplethObject = createChoroplethMap(geojsonAggregateData);
          var el = choroplethObject.element;

          var legendColor = el.find(legendColorSelector)[0];
          var legendColorFlyoutText = $(legendColor).data('flyout-text');

          el.on('SOCRATA_VISUALIZATION_CHOROPLETH_FLYOUT', function(event) {
            var payload = event.originalEvent.detail;

            expect(payload.title).to.equal(legendColorFlyoutText);

            done();
          });

          testHelpers.fireEvent(legendColor, 'mousemove');
        });

        it('should contain labels that are not rounded for small enough legend class breaks', function() {

          // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
          var geojsonAggregateData = testData.lineStringData3SmallNumbers;

          var choroplethObject = createChoroplethMap(geojsonAggregateData);
          var el = choroplethObject.element;

          // there should only be 3 features
          expect(el.find(featureGeometrySelector).length).to.equal(3);

          // there should only be 1 legend
          expect(el.find(legendSelector).length).to.equal(1);

          // there should only be 3 or more colors in the legend
          expect(el.find(legendColorSelector).length).to.be.above(2);

          // legend labels should contain feature values
          expect(_.intersection(legendFlyoutValues(el), dataFeatureValues(geojsonAggregateData)).length).to.be.above(1);

          // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
          var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
            var fillColor = $(el).css('stroke');
            return chroma.color(fillColor).hex();
          });
          var legendColors = _.map(el.find(legendColorSelector), function(el) {
            var legendColor = $(el).css('fill');
            return chroma.color(legendColor).hex();
          });

          expect(_.intersection(legendColors, fillColors).length).to.equal(fillColors.length);
        });

        it('renders a scale of blue that goes from fairly light, to fairly dark', function() {

          var featureCount = 11;
          var values = _.map(_.range(5, 5 + featureCount), function(value, i) {
            return { name: '' + i, value: value };
          });
          var geojsonAggregateData = aggregateDataForValues(values);

          var choroplethObject = createChoroplethMap(geojsonAggregateData);
          var el = choroplethObject.element;

          var legendColors = _.map(el.find(legendColorSelector), function(el) {
            var legendColor = $(el).css('fill');
            return chroma.color(legendColor);
          });

          // they should all be blue, except maybe for one white
          _.each(legendColors, function(color) {
            var rgb = color.rgb();
            expect(isBlue(rgb)).to.equal(true);
          });
          // should start relatively light, get progressively darker, and end relatively dark
          expect(legendColors[0].luminance()).to.be.greaterThan(0.7);
          for (var i = 1; i < legendColors.length; i++) {
            expect(legendColors[i].luminance()).to.be.lessThan(legendColors[i - 1].luminance());
          }
          expect(legendColors[legendColors.length - 1].luminance()).to.be.lessThan(0.2);
        });
      });

      describe('continous scale', function() {

        function toNumber(str) {

          switch (str.charAt(str.length - 1)) {
            case 'K':
              return parseFloat(str) * 1e3;
            case 'M':
              return parseFloat(str) * 1e6;
            case 'B':
              return parseFloat(str) * 1e9;
            default:
              if (str.indexOf('.') < 0) {
                return parseInt(str, 10);
              } else {
                return parseFloat(str);
              }
          }
        }

        describe('all positive values', function() {

          it('creates a linear scale for small ranges', function() {

            var featureCount = 10;
            var values = _.map(_.range(0, featureCount), function(value, i) {
              return { name: '' + i, value: value };
            });
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            var ticks = el.find('.continuous .tick');
            expect(ticks.length).to.be.closeTo(5, 1);

            var largeTicks = ticks.filter(':not(.small)');
            expect(largeTicks.length).to.equal(3);
            expect(toNumber(largeTicks.eq(1).text())).to.be.closeTo(4.5, .5);
          });

          it('creates a logarithmic scale for large ranges > 0', function() {

            var featureCount = 10;

            // Create a range that spans 3 orders of magnitude (eg goes to the hundreds), but
            // not three (eg doesn't get to the thousands). Let's say.. 0 to 13880ish
            // Also include a number close-to-but-not-equal-to zero to try to break
            // logarithmic scales nicing small numbers to zero.
            var values = _.map(_.range(0, featureCount * 1388, 101), function(value, i) {
              return { name: '' + i, value: value + 0.1 };
            });

            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            var ticks = el.find('.continuous .tick');
            expect(ticks.length).to.be.closeTo(5, 1);

            var largeTicks = ticks.filter(':not(.small)');
            expect(largeTicks.length).to.equal(3);
            expect(values[Math.ceil(values.length / 2)].value).to.be.
              greaterThan(toNumber(largeTicks.eq(1).text()));

            // Expect tick translation values to be finite numbers.
            _.each(ticks, function(tick) {
              var $tick = $(tick);
              var translate = $tick.attr('transform').match(/\(([0-9\.]+)\,([0-9\.]+)\)$/);

              if (translate !== null) {
                expect(translate).to.be.instanceof(Array);
                expect(isFinite(translate[1])).to.be.true;
                expect(isFinite(translate[2])).to.be.true;
              } else {

                // Have to handle a special case because IE translate attribute is formatted differently than in other browsers.
                expect($tick.attr('transform')).to.match(/^translate\(\d+(?:\.\d+)?(?:\s+\d+(?:\.\d+)?)?\)$/i);
              }
            });
          });
        });

        describe('all negative values', function() {

          it('creates a linear scale for small ranges', function() {

            var featureCount = 10;
            var values = _.map(_.range(-featureCount, 0), function(value, i) {
              return { name: '' + i, value: value };
            });
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            var ticks = el.find('.continuous .tick');
            expect(ticks.length).to.be.closeTo(5, 1);

            var largeTicks = ticks.filter(':not(.small)');
            expect(largeTicks.length).to.equal(3);
            expect(toNumber(largeTicks.eq(1).text())).to.be.closeTo(-4.5, .5);
          });

          it('creates a logarithmic scale for large ranges', function() {

            var featureCount = 10;
            // Create a range that spans 3 orders of magnitude.. say, -13880ish to 0
            var values = _.map(_.range(-featureCount * 1388, 0, 101), function(value, i) {
              return { name: '' + i, value: value };
            });
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            var ticks = el.find('.continuous .tick');
            expect(ticks.length).to.be.closeTo(5, 1);

            var largeTicks = ticks.filter(':not(.small)');
            expect(largeTicks.length).to.equal(3);
            expect(values[Math.floor(values.length / 2)].value).to.be.
              lessThan(toNumber(largeTicks.eq(1).text()));
          });
        });

        describe('values straddling zero', function() {

          it('creates a linear scale for small ranges', function() {

            var featureCount = 10;
            var values = _.map(
              _.range(-featureCount / 2, featureCount / 2, 1),
              function(value, i) {
                return { name: '' + i, value: value };
              }
            );
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            var ticks = el.find('.continuous .tick');
            expect(ticks.length).to.be.closeTo(5, 1);

            var largeTicks = ticks.filter(':not(.small)');
            expect(largeTicks.length).to.equal(3);
            expect(toNumber(largeTicks.eq(1).text())).to.be.closeTo(0, .5);
          });

          it('creates a linear scale for medium ranges', function() {

            var featureCount = 10;
            var values = _.map(
              // Values that span two magnitudes that straddle 0... say, -190ish to 190ish
              _.range(-featureCount * 19, featureCount * 19, 38),
              function(value, i) {
                return { name: '' + i, value: value };
              }
            );
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            var ticks = el.find('.continuous .tick');
            expect(ticks.length).to.be.closeTo(5, 1);

            var largeTicks = ticks.filter(':not(.small)');
            expect(largeTicks.length).to.equal(3);
            expect(toNumber(largeTicks.eq(1).text())).to.be.closeTo(0, .5);
          });

          it('creates a linear scale for large ranges', function() {

            var featureCount = 11;
            var values = _.map(_.range(0, featureCount), function(value, i) {
              // Values that span three magnitudes, straddling 0.. say, -2840 to 2840
              return { name: '' + i, value: value * 284 - 2840 / 2 };
            });
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            var ticks = el.find('.continuous .tick');
            expect(ticks.length).to.be.closeTo(5, 1);

            var largeTicks = ticks.filter(':not(.small)');
            expect(largeTicks.length).to.equal(3);
            expect(toNumber(largeTicks.eq(1).text())).to.be.closeTo(0, .5);
          });
        });

        describe('changing values', function() {

          it('rescales the legend for the new value', function() {

            // Create a dataset that straddles 0 but won't have a tick at 0.
            // Also make it a different scale than the next one, to maximize difference.
            var values = _.map(_.range(-1, 500, 50), function(value, i) {
              return { name: '' + i, value: value };
            });
            var geojsonAggregateData = aggregateDataForValues(values);

            var choroplethObject = createChoroplethMap(geojsonAggregateData, 'continuous');
            var el = choroplethObject.element;

            var ticks = el.find('.continuous .tick');
            // 5 ticks, plus the 0 tick. We need this for the test so that the number of ticks
            // will change between this legend and the next, so we can verify the code properly
            // takes that into account.
            expect(ticks.length).to.equal(6);

            var gradientSegments = el.find('rect');
            expect(gradientSegments.eq(0).attr('y')).to.equal('100%');
            expect(gradientSegments.last().attr('y')).to.equal('0%');

            values = _.map(_.range(0, 6), function(value, i) {
              return { name: '' + i, value: -value };
            });
            var newGeojsonAggregateData = aggregateDataForValues(values);

            choroplethObject.visualization.render(newGeojsonAggregateData, choroplethObject.options);

            ticks = el.find('.continuous .tick');
            // Should not have an extra 0 tick
            expect(ticks.length).to.equal(5);
            // The gradient rectangle should span the whole range
            gradientSegments = el.find('rect');
            expect(gradientSegments.eq(0).attr('y')).to.equal('100%');
            expect(gradientSegments.last().attr('y')).to.equal('0%');
          });
        });
      });
    });
  });

  // TODO: INVALID INPUT?
});
