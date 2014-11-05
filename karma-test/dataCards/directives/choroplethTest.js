describe("A Choropleth Directive", function() {

  function scopedFeatureValues() {
    return _.map(scope.geojsonAggregateData.features, function(feature){
      return Number(feature.properties[featureMergedValueName]);
    });
  }

  function legendFlyoutValues() {
    return _.map(el.find(legendColorSelector), function(el, i){
      var text = $(el).data('flyout-text');
      var num = Number(text);
      if (!num) {
        var numTexts = text.split(' - ');
        i == 0 ? num = Number(numTexts[0]) : num = Number(numTexts[1]);
      }
      return num;
    });
  }

  function createChoropleth(expanded) {
    scope.baseLayerUrl = 'https://a.tiles.mapbox.com/v3/socrata-apps.ibp0l899/{z}/{x}/{y}.png';
    scope.rowDisplayUnit = 'crimes';

    if (!scope.geojsonAggregateData) {
      scope.geojsonAggregateData = testData.polygonData2;
    }

    var html = '<choropleth base-layer-url="baseLayerUrl" geojson-aggregate-data="geojsonAggregateData" row-display-unit="rowDisplayUnit" style="height: 400px; display: block"></choropleth>';
    var el = testHelpers.TestDom.compileAndAppend(html, scope);
    // The choropleth throttles its renderer.
    // Lie to it that enough time has passed, so it renders now.
    fakeClock.tick(500);

    return el;
  }

  var rootScope;
  var scope;
  var testHelpers;
  var timeout;
  var AngularRxExtensions;
  var testData;
  var el;
  var testJson = 'karma-test/dataCards/test-data/choroplethTest/data.json';
  var legendSelector = '.choropleth-legend';
  var legendColorSelector = '.choropleth-legend .choropleth-legend-color';
  var featureGeometrySelector = '.leaflet-map-pane .leaflet-objects-pane .leaflet-overlay-pane svg path';
  var flyoutSelector = '#uber-flyout';
  var featureMergedValueName = '__SOCRATA_FILTERED_VALUE__';

  // NOTE! We mock out the clock.
  // This is done to get around choropleth
  // throttling its rendering.
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
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  beforeEach(function() {
    fakeClock = sinon.useFakeTimers();
  });

  afterEach(function() {
    fakeClock.restore();
    fakeClock = null;
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

      //it('should emit render:mapTilesLoaded event on rendering all tiles', function(done) {});
      //This test is unimplemented as it would require mocking out leaflet's event system and tile layer API.
    });

    // TODO: INVALID INPUT?

    it('should render a leaflet map, with zoom controls', function() {

      scope.geojsonAggregateData = testData.lineStringData2;
      el = createChoropleth();

      expect(el.find('.choropleth-map-container').length).to.equal(1);
      expect(el.find('.leaflet-map-pane').length).to.equal(1);
    });

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

    xit('should render a map with a bounding box that contains all the features', function() {
      scope.geojsonAggregateData = testData.easyBoundsData;
      el = createChoropleth();
      var expectedBounds = {
        northEast: { lat: 2, lng: 2 },
        southWest: { lat: -2, lng: -2 }
      };

      var scopeBounds = el.isolateScope().bounds;

      expect(scopeBounds.northEast.lat).to.deep.equal(expectedBounds.northEast.lat);
      expect(scopeBounds.northEast.lng).to.deep.equal(expectedBounds.northEast.lng);
      expect(scopeBounds.southWest.lat).to.deep.equal(expectedBounds.southWest.lat);
      expect(scopeBounds.southWest.lng).to.deep.equal(expectedBounds.southWest.lng);
    });

    it('should be able to render a legend if the choropleth has values', function() {
      scope.geojsonAggregateData = testData.multiLineStringData4;
      el = createChoropleth();

      expect(el.find(legendSelector).length).to.equal(1);
    });

    it('should not render a legend if the choropleth has no values', function() {
      scope.geojsonAggregateData = testData.polygonData2NoValues;
      el = createChoropleth();

      expect(el.find(legendSelector).children().length).to.equal(0);
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

    /* ---- DOUBLE CLICK EFFECTS ---- */

    it('should zoom the map if a map tile was double clicked', function() {
      scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
      el = createChoropleth();

      // Listen for the zoom events
      var zoomStart = -1;
      var zoomEnd = -1;
      scope.$on('zoomstart', function(e, map) {
        zoomStart = map.getZoom();
      });
      scope.$on('zoomend', function(e, map) {
        zoomEnd = map.getZoom();
      });

      testHelpers.fireMouseEvent(el.find('.leaflet-tile')[0], 'dblclick');

      expect(zoomStart).to.be.above(-1);
      expect(zoomStart).to.be.below(zoomEnd);
    });

    it('should zoom the map if a choropleth feature was double clicked', function() {
      scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
      el = createChoropleth();

      // Listen for the zoom events
      var zoomStart = -1;
      var zoomEnd = -1;
      scope.$on('zoomstart', function(e, map) {
        zoomStart = map.getZoom();
      });
      scope.$on('zoomend', function(e, map) {
        zoomEnd = map.getZoom();
      });
      
      var polygon = el.find('path')[0];
      testHelpers.fireMouseEvent(polygon, 'click');
      fakeClock.tick(50);
      testHelpers.fireMouseEvent(polygon, 'click');

      expect(zoomStart).to.be.above(-1);
      expect(zoomStart).to.be.below(zoomEnd);
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

    /* ---- MOUSEOVER EVENTS -------------------------------- */

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

    /* ---- FILTERING EVENTS -------------------------------- */

    describe('on clicking a region', function(){
      // TODO: UNSUCCESSFUL FILTERING?


      it('should signal the region to toggle in the active filter names', function() {
        scope.geojsonAggregateData = testData.polygonData2;
        el = createChoropleth();

        var polygon = el.find('path')[0];
        var secondLine = el.find('path')[1];
        var defaultStrokeWidth = parseInt($(polygon).css('strokeWidth'));
        var toggleFilterByRegionEventReceived = false;

        scope.$on('toggle-dataset-filter:choropleth', function() {
          toggleFilterByRegionEventReceived = true;
        });

        testHelpers.fireEvent(polygon, 'click');

        timeout.flush(); // click promise (lastTimer on geojsonClick in Choropleth.js)

        expect(toggleFilterByRegionEventReceived).to.equal(true);
      });
    });


    /*    LEGEND     */
    describe('legend', function() {

      describe('on an unexpanded card', function() {

        var expanded = false;

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
          expect($flyout.text()).to.equal(legendColorFlyoutText);
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
      });

      describe('on an expanded card', function() {

        var expanded = true;

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
          expect($flyout.find('.flyout-title').text()).to.equal(legendColorFlyoutText);
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
      });
    });
  });
});
