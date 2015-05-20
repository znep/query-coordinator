describe('A Choropleth Directive', function() {
  'use strict';

  // Indices into an rgb array, for greater semantics!
  var RED = 0;
  var GREEN = 1;
  var BLUE = 2;

  function scopedFeatureValues() {
    return _.map(scope.geojsonAggregateData.features, function(feature){
      return Number(feature.properties[featureMergedValueName]);
    });
  }

  function legendFlyoutValues() {
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

  function createChoropleth(expanded, attrs) {
    scope.baseLayerUrl = 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png';
    scope.rowDisplayUnit = 'crimes';

    if (!scope.geojsonAggregateData) {
      scope.geojsonAggregateData = testData.polygonData2;
    }

    var html = '<choropleth base-layer-url="baseLayerUrl" ' +
        'geojson-aggregate-data="geojsonAggregateData" ' +
        (attrs || '') +
        ' row-display-unit="rowDisplayUnit" ' +
        'style="height: 400px; display: block">' +
        '</choropleth>';
    var el = testHelpers.TestDom.compileAndAppend(html, scope);

    // Choropleth has "interesting" double-click detection, so we need to
    // manipulate time to get it to register clicks correctly
    fakeClock.tick(500);

    // Advance the Rx scheduler for dimension de-bouncing
    testTimeoutScheduler.advanceTo(500);

    return el;
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
        properties[Constants.INTERNAL_DATASET_FEATURE_ID] = '' + i;
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
              [ x0, y0 ],
              [ x0 + increment / 3, y0 + increment ],
              [ x0 + increment * 4 / 3, y0 + increment ],
              [ x0 + increment, y0 ]
            ]]
          }
        };
      }),
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }
    };
  }

  /**
   * Convenience function to massage the given values into something geoJsonAggregateData expects.
   *
   * @param {Number[]} values - The values to graph.
   * @return {Object} a geojson object, with features that contain aggregate values.
   *   @see CardVisualizationChoroplethHelpers.aggregateGeoJsonData
   */
  function aggregateDataForValues(values) {
    return cardVisualizationChoroplethHelpers.aggregateGeoJsonData(
      'geometryLabel',
      createGeoJsonData(values.length),
      values,
      values,
      null,
      'mycolumn',
      {mycolumn: {shapefile: null}}
    );
  }

  var rootScope;
  var scope;
  var testHelpers;
  var timeout;
  var AngularRxExtensions;
  var testData;
  var el;
  var cardVisualizationChoroplethHelpers;
  var testJson = 'karma-test/dataCards/test-data/choroplethTest/data.json';
  var legendSelector = '.choropleth-legend';
  var legendColorSelector = legendSelector + ' .choropleth-legend-color';
  var featureGeometrySelector = '.leaflet-map-pane .leaflet-objects-pane .leaflet-overlay-pane svg path';
  var flyoutSelector = '#uber-flyout';
  var featureMergedValueName = '__SOCRATA_FILTERED_VALUE__';
  var Constants;

  var testTimeoutScheduler;
  var normalTimeoutScheduler;

  beforeEach(function() {
    testTimeoutScheduler = new Rx.TestScheduler();
    normalTimeoutScheduler = Rx.Scheduler.timeout;
    Rx.Scheduler.timeout = testTimeoutScheduler;
  });

  afterEach(function() {
    Rx.Scheduler.timeout = normalTimeoutScheduler;
  });


  // NOTE! We mock out the clock.
  // This is done because we handle double-clicking features manually
  var fakeClock = null;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('dataCards/choropleth.sass'));
  beforeEach(module(testJson));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    AngularRxExtensions = $injector.get('AngularRxExtensions');
    testData = testHelpers.getTestJson(testJson);
    Constants = $injector.get('Constants');
    Constants.DISABLE_LEAFLET_ZOOM_ANIMATION = true;
    cardVisualizationChoroplethHelpers = $injector.get('CardVisualizationChoroplethHelpers');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  beforeEach(function() {
    fakeClock = sinon.useFakeTimers();
  });

  afterEach(function() {
    testHelpers.cleanUp();
    if (fakeClock) {
      fakeClock.restore();
      fakeClock = null;
    }
  });


  describe('with a valid geojsonAggregateData input', function() {
    describe('render timing events', function() {
      it('should emit render:start and render:complete events on rendering', function(done) {
        AngularRxExtensions.install(rootScope);

        var renderEvents = Rx.Observable.merge(
          rootScope.eventToObservable('render:start').first(),
          rootScope.eventToObservable('render:complete').first()
        );

        renderEvents.take(2).toArray().subscribe(
          function(events) {
            // Vis id is a string and is the same across events.
            expect(events[0].args[0].source).to.satisfy(_.isString);
            expect(events[1].args[0].source).to.equal(events[0].args[0].source);

            // Times are ints and are in order.
            expect(events[0].args[0].timestamp).to.satisfy(_.isFinite);
            expect(events[1].args[0].timestamp).to.satisfy(_.isFinite);

            expect(events[0].args[0].timestamp).to.be.below(events[1].args[0].timestamp);
            done();
          }
        );

        createChoropleth();
        // We need to call timeout.flush() after a clock tick,
        // because only that will guarantee that the choropleth actually started
        // a timeout (choropleth throttles its renders);
        timeout.flush();
      });
    });

    // TODO: INVALID INPUT?

    it('should render a leaflet map, with zoom controls', function() {

      scope.geojsonAggregateData = testData.lineStringData2;
      el = createChoropleth();

      expect(el.find('.choropleth-map-container').length).to.equal(1);
      expect(el.find('.leaflet-map-pane').length).to.equal(1);
    });

    describe('shapes', function() {
      it('should render Polygons on the map, if the geojson contains Polygons', function() {
        scope.geojsonAggregateData = testData.polygonData3;
        el = createChoropleth();

        expect(el.find(featureGeometrySelector).length).to.equal(3);
      });

      it('should render MultiPolygons on the map, if the geojson contains MultiPolygons', function() {
        scope.geojsonAggregateData = testData.multiPolygonData2;
        el = createChoropleth();

        expect(el.find(featureGeometrySelector).length).to.equal(2+3);
      });

      it('should render MultiLineStrings on the map, if the geojson contains MultiLineStrings', function() {
        scope.geojsonAggregateData = testData.multiLineStringData4;
        el = createChoropleth();

        expect(el.find(featureGeometrySelector).length).to.equal(12+15+6+3);
      });

      it('should render LineStrings on the map, if the geojson contains LineStrings', function() {
        scope.geojsonAggregateData = testData.lineStringData7;
        el = createChoropleth();

        expect(el.find(featureGeometrySelector).length).to.equal(7);
      });
    });

    describe('value display', function() {
      it('should be able to render a legend if the choropleth has values', function() {
        scope.geojsonAggregateData = testData.multiLineStringData4;
        el = createChoropleth();

        expect(el.find(legendSelector).length).to.equal(1);
      });

      it('should not render a legend if the choropleth has no values', function() {
        scope.geojsonAggregateData = testData.polygonData2NoValues;
        el = createChoropleth();

        // These rects are added by the legend render code - they won't be there
        // unless that code creates them.
        expect(el.find(legendSelector).find('rect').children().length).to.equal(0);
      });

      it('should render proper map features, legend, and legend labels for 1 line feature', function() {
        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var expanded = true;
        scope.geojsonAggregateData = testData.lineStringData1;
        el = createChoropleth(expanded);

        // there should only be 1 feature
        expect(el.find(featureGeometrySelector).length).to.equal(1);

        // there should only be 1 legend
        expect(el.find(legendSelector).length).to.equal(1);

        // there should only be 1 color in the legend
        expect(el.find(legendColorSelector).length).to.equal(1);

        // legend label should match feature value
        expect(legendFlyoutValues()).to.deep.equal(scopedFeatureValues());

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hex(es) should match legend color hex(es)
        var fillColor = el.find(featureGeometrySelector).css('stroke');
        var legendColor = el.find(legendColorSelector).css('fill');

        expect(chroma.color(fillColor).hex()).to.equal(chroma.color(legendColor).hex());
      });

      it('should render proper map features, legend, and legend labels for 1 polygon feature', function() {
        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var expanded = true;
        scope.geojsonAggregateData = testData.polygonData1;
        el = createChoropleth(expanded);

        // there should only be 1 feature
        expect(el.find(featureGeometrySelector).length).to.equal(1);

        // there should only be 1 legend
        expect(el.find(legendSelector).length).to.equal(1);

        // there should only be 1 color in the legend
        expect(el.find(legendColorSelector).length).to.equal(1);

        // legend label should match feature value
        expect(legendFlyoutValues()).to.deep.equal(scopedFeatureValues());

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hex(es) should match legend color hex(es)
        var fillColor = el.find(featureGeometrySelector).css('fill');
        var legendColor = el.find(legendColorSelector).css('fill');
        expect(chroma.color(fillColor).hex()).to.equal(chroma.color(legendColor).hex());
      });

      it('should render proper map features, legend, and legend labels for 2 features', function() {
        // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
        var expanded = true;
        scope.geojsonAggregateData = testData.polygonData2;
        el = createChoropleth(expanded);

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // there should only be 1 legend
        expect(el.find(legendSelector).length).to.equal(1);

        // there should only be 2 or more colors in the legend
        expect(el.find(legendColorSelector).length).to.be.above(1);

        // legend labels should contain feature values
        expect(_.intersection(legendFlyoutValues(), scopedFeatureValues()).length).to.equal(scopedFeatureValues().length);

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
        var expanded = true;
        scope.geojsonAggregateData = testData.lineStringData3;
        el = createChoropleth(expanded);

        // there should only be 3 features
        expect(el.find(featureGeometrySelector).length).to.equal(3);

        // there should only be 1 legend
        expect(el.find(legendSelector).length).to.equal(1);

        // there should only be 3 or more colors in the legend
        expect(el.find(legendColorSelector).length).to.be.above(2);

        // legend labels should contain feature values
        expect(_.intersection(legendFlyoutValues(), scopedFeatureValues()).length).to.equal(scopedFeatureValues().length);

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
        scope.geojsonAggregateData = testData.lineStringData52;
        el = createChoropleth();

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
          }
        }
        it('colors red-orange scale for all negative values', function() {
          var featureCount = 11;
          var values = _.map(_.range(-featureCount, 0), function(value, i) {
            return { name: '' + i, value: value };
          });
          scope.geojsonAggregateData = aggregateDataForValues(values);
          el = createChoropleth();

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
          scope.geojsonAggregateData = aggregateDataForValues(values);
          el = createChoropleth();

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
              scope.geojsonAggregateData = aggregateDataForValues(values);
              el = createChoropleth();

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
          scope.geojsonAggregateData = aggregateDataForValues(values);
          el = createChoropleth();

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
        scope.geojsonAggregateData = testData.polygonData2PropertyMissing;
        el = createChoropleth();

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // there should only be 1 legend with 1 color
        expect(el.find(legendSelector).length).to.equal(1);
        expect(el.find(legendColorSelector).length).to.equal(1);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el){
          var color = $(el).css('fill');
          return chroma.color(color).hex();
        });
        var nullColors = _.filter(fillColors, function(fc){ return chroma.color(fc).hex() == '#dddddd' });

        expect(nullColors.length).to.equal(1);
      });

      it('should not color features that have null values', function(){
        scope.geojsonAggregateData = testData.polygonData2ValueNull;
        el = createChoropleth();

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // there should only be 1 legend with 1 color
        expect(el.find(legendSelector).length).to.equal(1);
        expect(el.find(legendColorSelector).length).to.equal(1);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el){
          var color = $(el).css('fill');
          return chroma.color(color).hex();
        });
        var nullColors = _.filter(fillColors, function(fc){ return chroma.color(fc).hex() == '#dddddd' });
        expect(nullColors.length).to.equal(1);
      });

      it('should not color features that have undefined values', function(){
        scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
        el = createChoropleth();

        // there should only be 2 features
        expect(el.find(featureGeometrySelector).length).to.equal(2);

        // there should only be 1 legend with 1 color
        expect(el.find(legendSelector).length).to.equal(1);
        expect(el.find(legendColorSelector).length).to.equal(1);

        // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
        var fillColors = _.map(el.find(featureGeometrySelector), function(el){
          var color = $(el).css('fill');
          return chroma.color(color).hex();
        });
        var nullColors = _.filter(fillColors, function(fc){ return chroma.color(fc).hex() == '#dddddd' });
        expect(nullColors.length).to.equal(1);
      });

      describe('1-2 values', function() {
        describe('discrete legend', function() {
          // We want to test both datasets with only one row, as well as multiple rows with the same
          // value. They should display the same on the legend.
          _.each(_.range(1, 3), function(valueCount) {
            var values = _.map(_.range(0, valueCount), function(i) {
              return {name: '' + i, value: 100};
            });
            it('colors datasets blue with {0} rows, 1 unique positive value'.format(valueCount), function() {
              scope.geojsonAggregateData = aggregateDataForValues(values);
              el = createChoropleth();

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
              return {name: '' + i, value: -128};
            });
            it('colors red datasets {0} rows, 1 unique negative value'.format(valueCount), function() {
              scope.geojsonAggregateData = aggregateDataForValues(values);
              el = createChoropleth();

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
              return {name: '' + i, value: 0};
            });
            it('colors white datasets with {0} rows, 1 value = 0'.format(valueCount), function() {
              scope.geojsonAggregateData = aggregateDataForValues(values);
              el = createChoropleth();

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
            var values = _.map(_.range(5, 100, 90), function(v, i) { return {name: '' + i, value: v}; });
            scope.geojsonAggregateData = aggregateDataForValues(values);
            el = createChoropleth();

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
            var values = _.map(_.range(-100, -5, 90), function(v, i) { return {name: '' + i, value: v}; });
            scope.geojsonAggregateData = aggregateDataForValues(values);
            el = createChoropleth();

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
            var values = _.map(_.range(-50, 50, 90), function(v, i) { return {name: '' + i, value: v}; });
            scope.geojsonAggregateData = aggregateDataForValues(values);
            el = createChoropleth();

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
            scope.geojsonAggregateData = aggregateDataForValues(values);
            el = createChoropleth(false, 'stops="continuous"');

            // Both the region and the legend should be blueish
            var element = el.find(featureGeometrySelector);
            expect(element.length).to.equal(1);
            var elementColor = chroma.color(element.css('fill')).rgb();
            expect(isBlue(elementColor)).to.equal(true);

            var gradient = el.find(legendSelector).
                find('#gradient').
                find('stop[offset="100%"]');
            expect(gradient.length).to.equal(1);
            var elementColor = chroma.color(gradient.css('stop-color')).rgb();
            expect(isBlue(elementColor)).to.equal(true);
          });

          it('colors datasets red with only one negative value', function() {
            var values = [{ name: '0', value: -128 }];
            scope.geojsonAggregateData = aggregateDataForValues(values);
            el = createChoropleth(false, 'stops="continuous"');

            // Both the region and the legend should be reddish
            var element = el.find(featureGeometrySelector);
            expect(element.length).to.equal(1);
            var elementColor = chroma.color(element.css('fill')).rgb();
            expect(isRed(elementColor)).to.equal(true);

            var gradient = el.find(legendSelector).
                find('#gradient').
                find('stop[offset="0%"]');
            expect(gradient.length).to.equal(1);
            var elementColor = chroma.color(gradient.css('stop-color')).rgb();
            expect(isRed(elementColor)).to.equal(true);
          });

          it('colors white datasets with only one value = 0', function() {
            var values = [{ name: '0', value: 0 }];
            scope.geojsonAggregateData = aggregateDataForValues(values);
            el = createChoropleth(false, 'stops="continuous"');

            // Both the region and the legend should be white-ish
            var element = el.find(featureGeometrySelector);
            expect(element.length).to.equal(1);
            var elementColor = chroma.color(element.css('fill')).rgb();
            expect(isGray(elementColor)).to.equal(true);

            var gradient = el.find(legendSelector).
                find('#gradient').
                find('stop[offset="0%"]');
            expect(gradient.length).to.equal(1);
            var elementColor = chroma.color(gradient.css('stop-color')).rgb();
            expect(isGray(elementColor)).to.equal(true);
          });
        });
      });
    });

    describe('double-click effects', function() {
      it('should zoom the map if a map tile was double clicked', function() {
        scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
        el = createChoropleth();

        var zoomStartSpy = sinon.spy();
        var zoomEndSpy = sinon.spy();

        scope.$on('zoomstart', zoomStartSpy);
        scope.$on('zoomend', zoomEndSpy);

        scope.$apply(function() {
          testHelpers.fireMouseEvent(el.find('.leaflet-tile')[0], 'dblclick');
        });
        expect(zoomStartSpy).to.have.been.called;
        expect(zoomEndSpy).to.have.been.called;
      });

      it('should zoom the map if a choropleth feature was double clicked', function(done) {
        scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
        el = createChoropleth();

        // Listen for the zoom events
        var zoomStart = null;
        var zoomEnd = null;
        scope.$on('zoomstart', function(e, map) {
          zoomStart = map.getZoom();
        });
        scope.$on('zoomend', function(e, map) {
          zoomEnd = map.getZoom();
          expect(zoomStart).to.not.equal(null);
          expect(zoomStart).to.be.below(zoomEnd);
          done();
        });

        var polygon = el.find('path')[0];
        testHelpers.fireMouseEvent(polygon, 'click');
        fakeClock.tick(50);
        testHelpers.fireMouseEvent(polygon, 'click');
      });

      it('should preserve the styles on a highlighted feature if the highlighted feature was double clicked', function() {
        scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
        el = createChoropleth();

        var polygon = el.find('path')[0];
        var defaultStrokeWidth = parseInt($(polygon).css('strokeWidth'));

        testHelpers.fireEvent(polygon, 'dblclick');

        var strokeWidth = parseInt($(polygon).css('strokeWidth'));

        expect(strokeWidth).to.equal(defaultStrokeWidth);
      });
    });

    describe('mouseover events', function() {
      it('should toggle highlight on an unfiltered region on mouseover and mouseout', function() {
        scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
        el = createChoropleth();

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
    });

    /* ---- FILTERING EVENTS -------------------------------- */

    describe('on clicking a region', function(){
      // TODO: UNSUCCESSFUL FILTERING?


      it('should signal the region to toggle in the active filter names', function() {
        var toggleDatasetFilterCallback = sinon.spy();
        scope.geojsonAggregateData = testData.polygonData2;
        el = createChoropleth();

        var polygon = el.find('path')[0];

        scope.$on('toggle-dataset-filter:choropleth', toggleDatasetFilterCallback);

        testHelpers.fireEvent(polygon, 'click');

        timeout.flush(); // click promise (lastTimer on geojsonClick in Choropleth.js)

        expect(toggleDatasetFilterCallback).to.have.been.called;
      });
    });


    describe('legend', function() {
      _.each([true, false], function(expanded) {

        describe('on an ' + (expanded ? 'expanded' : 'unexpanded') + ' card', function() {
          describe('discrete scale', function() {
            it('should contain labels that are evenly spaced numbers', function() {
              scope.geojsonAggregateData = testData.polygonData2;
              el = createChoropleth(expanded);

              var ticks = el.find(legendSelector + ' .labels .tick');
              var offsets = _.map(ticks, function(tick) {
                var translateString = $(tick).attr('transform');
                var yOffset = parseInt(translateString.replace(/translate\(\d+\D+/,''));
                return yOffset;
              });
              // test for equidistant y offsets (check within +/- 2 px, due to floating point issues)
              var isEquidistant = _.reduce(offsets, function(difference, offset, i) {
                if (i == offsets.length - 1) {
                  return difference ? true: false;
                }
                return Math.abs(difference - (offset - offsets[i+1])) <= 2 ? difference : false;
              }, offsets[0] - offsets[1]);
              expect(isEquidistant).to.equal(true);
            });

            it('should show a flyout with text upon hover over a legend color', function() {
              scope.geojsonAggregateData = testData.polygonData2;
              el = createChoropleth(expanded);

              var legendColor = el.find(legendColorSelector)[0];
              var legendColorFlyoutText = $(legendColor).data('flyout-text');

              testHelpers.fireEvent(legendColor, 'mousemove');

              var $flyout = $(flyoutSelector);
              expect($flyout.is(':visible')).to.equal(true);
              expect($flyout.find('.flyout-title').html()).to.equal(legendColorFlyoutText);
            });

            it('should contain labels that are not rounded for small enough legend class breaks', function(){
              // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
              scope.geojsonAggregateData = testData.lineStringData3SmallNumbers;
              el = createChoropleth(expanded);

              // there should only be 3 features
              expect(el.find(featureGeometrySelector).length).to.equal(3);

              // there should only be 1 legend
              expect(el.find(legendSelector).length).to.equal(1);

              // there should only be 3 or more colors in the legend
              expect(el.find(legendColorSelector).length).to.be.above(2);

              // legend labels should contain feature values
              expect(_.intersection(legendFlyoutValues(), scopedFeatureValues()).length).to.be.above(1);

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
              scope.geojsonAggregateData = aggregateDataForValues(values);
              el = createChoropleth();

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
              for (var i=1; i<legendColors.length; i++) {
                expect(legendColors[i].luminance()).to.be.lessThan(legendColors[i - 1].luminance());
              }
              expect(legendColors[legendColors.length - 1].luminance()).to.be.lessThan(0.2);
            });
          });

          describe('continous scale', function() {
            function toNumber(str) {
              switch(str.charAt(str.length - 1)) {
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
                scope.geojsonAggregateData = aggregateDataForValues(values);
                el = createChoropleth(expanded, 'stops="continuous"');

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
                var values = _.map(_.range(0, featureCount * 1388, 101), function(value, i) {
                  return { name: '' + i, value: value + 1 };
                });
                scope.geojsonAggregateData = aggregateDataForValues(values);
                el = createChoropleth(expanded, 'stops="continuous"');

                var ticks = el.find('.continuous .tick');
                expect(ticks.length).to.be.closeTo(5, 1);
                var largeTicks = ticks.filter(':not(.small)');
                expect(largeTicks.length).to.equal(3);
                expect(values[Math.ceil(values.length / 2)].value).to.be.
                  greaterThan(toNumber(largeTicks.eq(1).text()));
              });
            });

            describe('all negative values', function() {
              it('creates a linear scale for small ranges', function() {
                var featureCount = 10;
                var values = _.map(_.range(-featureCount, 0), function(value, i) {
                  return { name: '' + i, value: value };
                });
                scope.geojsonAggregateData = aggregateDataForValues(values);
                el = createChoropleth(expanded, 'stops="continuous"');

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
                scope.geojsonAggregateData = aggregateDataForValues(values);
                el = createChoropleth(expanded, 'stops="continuous"');

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
                scope.geojsonAggregateData = aggregateDataForValues(values);
                el = createChoropleth(expanded, 'stops="continuous"');

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
                scope.geojsonAggregateData = aggregateDataForValues(values);
                el = createChoropleth(expanded, 'stops="continuous"');

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
                scope.geojsonAggregateData = aggregateDataForValues(values);
                el = createChoropleth(expanded, 'stops="continuous"');

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
                scope.geojsonAggregateData = aggregateDataForValues(values);
                el = createChoropleth(expanded, 'stops="continuous"');

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
                scope.geojsonAggregateData = aggregateDataForValues(values);
                scope.$digest();

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
    });
  });
});
