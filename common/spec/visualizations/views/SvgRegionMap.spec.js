import _ from 'lodash';
import $ from 'jquery';
import chroma from 'chroma-js';
import svgRegionMapTestData from '../svgRegionMapTestData/svgRegionMapTestData';
import SvgRegionMap from 'common/visualizations/views/SvgRegionMap';
import testHelpers from '../testHelpers';

describe('SvgRegionMap', function() {
  // Indices into an rgb array, for greater semantics!
  var RED = 0;
  var GREEN = 1;
  var BLUE = 2;

  var DEFAULT_BASE_LAYER_URL = 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png';
  var DEFAULT_BASE_LAYER_OPACITY = 0.8;

  var rootScope;
  var testData;

  var legendSelector = '.region-map-legend';
  var legendColorSelector = legendSelector + ' .region-map-legend-color';
  var featureGeometrySelector = '.leaflet-map-pane .leaflet-objects-pane .leaflet-overlay-pane svg path';
  var flyoutSelector = '#uber-flyout';
  var featureMergedValueName = '__SOCRATA_FEATURE_VALUE__';

  // NOTE! We mock out the clock.
  // This is done because we handle double-clicking features manually
  var fakeClock = null;

  function getDefaultVif() {

    return {
      'configuration': {
        'axisLabels': {
          'top': false,
          'right': false,
          'bottom': false,
          'left': false
        },
        'interactive': true,
        'localization': {
          'flyout_amount_label': 'Total',
          'flyout_selected_notice': 'This visualization is being filtered by this item.',
          'no_value': '(No Value)'
        },
        'computedColumnName': ':@wards',
        'legend': {
          'type': 'discrete'
        },
        'shapefile': {
          'geometryLabel': null,
          'primaryKey': 'primaryKey',
          'uid': 'snuk-a5kv'
        },
        // If you change to true, make sure to mock out the resultant MetadataProvider request.
        'viewSourceDataLink': false
      },
      'description': 'An example Region Map',
      'format': {
        'type': 'visualization_interchange_format',
        'version': 2
      },
      'scale': {
        'x': {
          'type': 'ordinal',
          'unit': {
            'one':null,
            'other':null
          }
        },
        'y': {
          'type': 'quantitative'
        }
      },
      'series': [
        {
          'dataSource': {
            'datasetUid': '52my-2pak',
            'dimension': {
              'columnName': 'location_point',
              'aggregationFunction': null
            },
            'domain': 'dataspace.demo.socrata.com',
            'measure': {
              'columnName': null,
              'aggregationFunction': 'count'
            },
            'filters': [],
            'type': 'socrata.soql'
          },
          'label': 'Filtered',
          'unit': {
            'one': 'crime',
            'other': 'crimes'
          },
          'type': 'choroplethMap'
        }
      ],
      'title': 'Example Usage: RegionMap.js'
    };
  }

  function dataFeatureValues(geojsonAggregateData) {
    return _.map(geojsonAggregateData.features, function(feature) {
      return Number(feature.properties[SvgRegionMap.SHAPEFILE_REGION_VALUE]);
    });
  }

  function legendFlyoutValues(el) {

    return _.map(el.find(legendColorSelector), function(el, i) {
      var text = $(el).attr('data-flyout-text');
      var num = Number(text);

      if (!num) {
        var numTexts = text.split(' ');

        num = i == 0 ? Number(numTexts[0]) : Number(numTexts[2]);
      }

      return num;
    });
  }

  function createRegionMap(vif, data, legendType) {

    if (_.isUndefined(data)) {
      data = testData.polygonData2;
    }

    var $element = $(
      '<div>',
      {
        'id': 'region-map'
      }
    );

    $element.width(640);
    $element.height(480);

    $('body').append($element);

    var visualization = new SvgRegionMap($element, vif);
    visualization.render(vif, data);

    // Choropleth has "interesting" double-click detection, so we need to
    // manipulate time to get it to register clicks correctly
    fakeClock.tick(500);

    return {
      element: $element,
      visualization: visualization,
      vif: vif,
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
  function aggregateDataForValues(vifToRender, data) {
    var dataAsHash = _.mapValues(_.keyBy(data, 'name'), 'value');
    var filters = _.get(vifToRender, 'series[0].dataSource.filters', []);
    var computedColumnName = _.get(vifToRender, 'configuration.computedColumnName');
    var ownFilterOperands = filters.
      filter(
        function(filter) {
          var columnName = _.get(vifToRender, 'series[0].dataSource.dimension.columnName');

          return (
            (filter.columnName === columnName) &&
            (filter.function === 'binaryComputedGeoregionOperator') &&
            (filter.arguments.computedColumnName === computedColumnName)
          );
        }
      ).
      map(
        function(filter) {
          return filter.arguments.operand;
        }
      );

    return mergeRegionAndData(
      'geometryLabel',
      'primaryKey',
      createGeoJsonData(data.length),
      dataAsHash,
      ownFilterOperands,
      vifToRender
    );
  }

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
        return _.get(geojsonFeature, 'properties.{0}'.format(primaryKey));
      }).
      map(function(geojsonFeature) {
        var name = _.get(geojsonFeature, 'properties.{0}'.format(primaryKey));
        var value = Number(dataAsHash[name]);
        var humanReadableName = _.get(geojsonFeature, 'properties.{0}'.format(geometryLabel), '');
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
   * Tests begin here
   */
  beforeEach(function() {
    testData = svgRegionMapTestData;

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

    $('#region-map').remove();
  });


  describe('with a valid geojsonAggregateData input', function() {

    xdescribe('render timing events', function() {

      it('should emit render start and complete events on rendering', function(done) {
        var geojsonAggregateData = testData.lineStringData2;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;
        var visualization = regionMapObject.visualization;
        var vif = regionMapObject.vif;
        var data = regionMapObject.data;

        var startTime;

        el.on('SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_START', function(e) {

          var payload = e.originalEvent.detail;
          startTime = payload.timestamp;

          expect(startTime).to.satisfy(_.isFinite);

          fakeClock.tick(50);
        });

        el.on('SOCRATA_VISUALIZATION_CHOROPLETH_RENDER_COMPLETE', function(e) {

          var payload = e.originalEvent.detail;
          var endTime = payload.timestamp;

          expect(endTime).to.satisfy(_.isFinite);
          expect(startTime).to.be.below(endTime);

          done();
        });

        visualization.render(vif, data);
      });
    });

    it('should render a leaflet map, with zoom controls', function() {
      var geojsonAggregateData = testData.lineStringData2;
      var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
      var el = regionMapObject.element;

      expect(el.find('.region-map.leaflet-container').length).to.equal(1);
    });

    describe('base layer', function() {

      it('should update tiles', function() {
        var geojsonAggregateData = testData.lineStringData2;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;
        var originalBaseLayerUrl = el.find('.leaflet-tile')[0].src;
        var newVif = getDefaultVif();

        newVif.configuration.baseLayerUrl = 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png';
        newVif.configuration.baseLayerOpacity = DEFAULT_BASE_LAYER_OPACITY;

        regionMapObject.visualization.render(newVif);

        expect(el.find('.leaflet-tile')[0].src).to.not.equal(originalBaseLayerUrl);
      });
    });

    describe('shapes', function() {

      it('should render Polygons on the map, if the geojson contains Polygons', function() {
        var geojsonAggregateData = testData.polygonData3;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        expect(el.find(featureGeometrySelector).length).to.equal(3);
      });

      it('should render MultiPolygons on the map, if the geojson contains MultiPolygons', function() {
        var geojsonAggregateData = testData.multiPolygonData2;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        expect(el.find(featureGeometrySelector).length).to.equal(2 + 3);
      });

      it('should render MultiLineStrings on the map, if the geojson contains MultiLineStrings', function() {
        var geojsonAggregateData = testData.multiLineStringData4;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        expect(el.find(featureGeometrySelector).length).to.equal(12 + 15 + 6 + 3);
      });

      it('should render LineStrings on the map, if the geojson contains LineStrings', function() {
        var geojsonAggregateData = testData.lineStringData7;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        expect(el.find(featureGeometrySelector).length).to.equal(7);
      });
    });

    describe('value display', function() {

      it('should render proper map features for 1 line feature', function() {
        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var geojsonAggregateData = testData.lineStringData1;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        // there should only be 1 feature
        expect(el.find(featureGeometrySelector).length).to.equal(1);
      });

      it('should render proper map features for 1 polygon feature', function() {
        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var geojsonAggregateData = testData.polygonData1;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        // there should only be 1 feature
        expect(el.find(featureGeometrySelector).length).to.equal(1);
      });

      it('should render proper map features for 2 features', function() {
        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var geojsonAggregateData = testData.polygonData2;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);
      });

      it('should render proper map features for 3 features', function() {
        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var geojsonAggregateData = testData.lineStringData3;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        // there should only be 3 features
        expect(el.find(featureGeometrySelector).length).to.equal(3);
      });

      it('should render proper map features for many features', function() {
        var geojsonAggregateData = testData.lineStringData52;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        // there should only be 52 features
        expect(el.find(featureGeometrySelector).length).to.equal(52);
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
          var vif = getDefaultVif();
          var geojsonAggregateData = aggregateDataForValues(vif, values);
          var regionMapObject = createRegionMap(vif, geojsonAggregateData);
          var el = regionMapObject.element;

          // the normal stuff should still be there
          expect(el.find(featureGeometrySelector).length).to.equal(featureCount);

          // The regions should be reddish
          var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
            var fillColor = $(el).css('fill');
            return chroma.color(fillColor);
          });

          expect(fillColors.length).to.be.greaterThan(2);

          // Assert that they're reddish
          var fillColorCount = countColors(fillColors);

          expect(fillColorCount.red).to.be.greaterThan(0);
          expect(fillColorCount.blue).to.equal(0);

          // But there shouldn't be _too_ many white values.
          expect(fillColorCount.white).to.be.lessThan(2);
        });

        it('colors red-orange - white - blue for range of values straddling 0', function() {
          var featureCount = 11;
          var start = -Math.floor(featureCount / 2);
          var values = _.map(_.range(start, start + featureCount), function(value, i) {
            return { name: '' + i, value: value };
          });
          var vif = getDefaultVif();
          var geojsonAggregateData = aggregateDataForValues(vif, values);
          var regionMapObject = createRegionMap(vif, geojsonAggregateData);
          var el = regionMapObject.element;

          // the normal stuff should still be there
          expect(el.find(featureGeometrySelector).length).to.equal(featureCount);

          // Both the regions and the legend should have red / white / blue
          var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
            var fillColor = $(el).css('fill');
            return chroma.color(fillColor);
          });

          expect(fillColors.length).to.be.greaterThan(2);

          var colorCount = countColors(fillColors);

          // There should be at least one white value in the regions of this particular dataset.
          expect(colorCount.white).to.be.greaterThan(0);
          // But there shouldn't be _too_ many of them. Assert that less than half the (regions +
          // legend steps) are white.
          expect(colorCount.white).to.be.lessThan(featureCount / 2);
          // There should be blue and red regions too
          expect(colorCount.blue).to.be.greaterThan(0);
          expect(colorCount.red).to.be.greaterThan(0);
        });
      });
    });

    describe('feature colors', function() {

      it('should not color features that are missing properties', function() {
        var geojsonAggregateData = testData.polygonData2PropertyMissing;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

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
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
          return chroma.color($(el).css('fill')).hex();
        });
        var nullColors = _.filter(fillColors, function(fc) { return chroma.color(fc).hex() == '#dddddd'; });

        expect(nullColors.length).to.equal(1);
      });

      it('should not color features that have undefined values', function() {
        var geojsonAggregateData = testData.polygonData2ValueUndefined;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el) {
          return chroma.color($(el).css('fill')).hex();
        });
        var nullColors = _.filter(fillColors, function(fc) { return chroma.color(fc).hex() == '#dddddd'; });

        expect(nullColors.length).to.equal(1);
      });

      describe('1-2 values', function() {

        it('colors datasets with only one positive value blue', function() {
          var vif = getDefaultVif();
          var values = [{ name: '0', value: 100 }];
          var geojsonAggregateData = aggregateDataForValues(vif, values);
          var regionMapObject;
          var el;

          vif.configuration.legend.type = 'continuous';
          regionMapObject = createRegionMap(vif, geojsonAggregateData);
          el = regionMapObject.element;

          var feature = el.find(featureGeometrySelector);

          expect(feature.length).to.equal(1);

          var featureColor = chroma.color(feature.css('fill')).rgb();

          expect(isBlue(featureColor)).to.equal(true);
        });

        it('colors datasets with only one negative value red', function() {
          var vif = getDefaultVif();
          var values = [{ name: '0', value: -128 }];
          var geojsonAggregateData = aggregateDataForValues(vif, values);
          var regionMapObject;
          var el;

          vif.configuration.legend.type = 'continuous';
          regionMapObject = createRegionMap(vif, geojsonAggregateData);
          el = regionMapObject.element;

          var element = el.find(featureGeometrySelector);

          expect(element.length).to.equal(1);

          var elementColor = chroma.color(element.css('fill')).rgb();

          expect(isRed(elementColor)).to.equal(true);
        });

        it('colors datasets with only a zero value white', function() {
          var vif = getDefaultVif();
          var values = [{ name: '0', value: 0 }];
          var geojsonAggregateData = aggregateDataForValues(vif, values);
          var regionMapObject;
          var el;

          vif.configuration.legend.type = 'continuous';
          regionMapObject = createRegionMap(vif, geojsonAggregateData);
          el = regionMapObject.element;

          var element = el.find(featureGeometrySelector);

          expect(element.length).to.equal(1);

          var elementColor = chroma.color(element.css('fill')).rgb();

          expect(isGray(elementColor)).to.equal(true);
        });

        it('does not render if no data is present', function() {
          var vif = getDefaultVif();
          var geojsonAggregateData = testData.polygonData2NoValues;
          var regionMapObject;
          var el;

          vif.configuration.legend.type = 'continuous';
          regionMapObject = createRegionMap(vif, geojsonAggregateData);
          el = regionMapObject.element;

          expect(el.find(legendSelector).find('rect').children().length).to.equal(0);
          expect(el.find(legendSelector).find('g.tick').children().length).to.equal(0);
        });
      });
    });

    describe('double-click effects', function() {

      it('should zoom the map if a map tile was double clicked', function() {
        var geojsonAggregateData = testData.polygonData2ValueUndefined;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;
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
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        el.on('SOCRATA_VISUALIZATION_REGION_MAP_REGION_SELECTED', function(e) {

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
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;
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
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;
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
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;
        var feature = $(el).find(featureGeometrySelector)[0];
        var mouseEventCount = 0;

        el.on('SOCRATA_VISUALIZATION_REGION_MAP_FLYOUT', function(e) {

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
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;

        el.on('SOCRATA_VISUALIZATION_REGION_MAP_CENTER_AND_ZOOM_CHANGED', function(e) {
          var payload = e.originalEvent.detail;

          expect(payload.hasOwnProperty('center')).to.be.true;
          expect(payload.hasOwnProperty('zoom')).to.be.true;
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
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;
        var visualization = regionMapObject.visualization;

        el.find('.choropleth-container').width(10);
        visualization.invalidateSize();

        expect(invalidateSizeSpy).to.have.been.called;
      });

      it('should not re-center map if dimensions have not changed', function() {
        var geojsonAggregateData = testData.lineStringData2;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;
        var visualization = regionMapObject.visualization;

        visualization.invalidateSize();

        expect(invalidateSizeSpy).to.not.have.been.called;
      });
    });

    describe('on clicking a region', function() {

      it('should emit an event with feature details', function(done) {
        var geojsonAggregateData = testData.polygonData2;
        var regionMapObject = createRegionMap(getDefaultVif(), geojsonAggregateData);
        var el = regionMapObject.element;
        var polygon = el.find('path.leaflet-clickable')[0];

        el.on('SOCRATA_VISUALIZATION_REGION_MAP_REGION_SELECTED', function(e) {
          var payload = e.originalEvent.detail;

          expect(payload).to.not.be.undefined;
          done();
        });

        testHelpers.fireMouseEvent(polygon, 'click');
        fakeClock.tick(200);
      });
    });
  });
});
