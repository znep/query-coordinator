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
    return testHelpers.TestDom.compileAndAppend(html, scope);
  }

  var scope;
  var testHelpers;
  var timeout;
  var testData;
  var el;
  var testJson  = 'karma-test/dataCards/test-data/choroplethTest/data.json';
  var legendSelector = '.choropleth-legend';
  var legendColorSelector = '.choropleth-legend .color';
  var featureGeometrySelector = '.leaflet-map-pane .leaflet-objects-pane .leaflet-overlay-pane svg path';
  var flyoutSelector = '#choropleth-flyout';
  var featureMergedValueName = '__SOCRATA_FILTERED_VALUE__';


  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('dataCards/choropleth.sass'));
  beforeEach(module(testJson));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    testData = testHelpers.getTestJson(testJson);
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });


  describe('with a valid geojsonAggregateData input', function() {
    // TODO: INVALID INPUT?

    it('should render a leaflet map, with zoom controls', function() {

      scope.geojsonAggregateData = testData.lineStringData2;
      el = createChoropleth();

      expect(el.find('.choropleth-map-container').length).to.equal(1);
      expect(el.find('.leaflet-map-pane').length).to.equal(1);
    });

    it('should render Polygons on the map, if the geojson contains Polygons', function(done) {
      scope.geojsonAggregateData = testData.polygonData3;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

          expect(el.find(featureGeometrySelector).length).to.equal(3);
          done();
        });
    });

    it('should render MultiPolygons on the map, if the geojson contains MultiPolygons', function(done) {
      scope.geojsonAggregateData = testData.multiPolygonData2;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

          expect(el.find(featureGeometrySelector).length).to.equal(2+3);
          done();
        });
    });

    it('should render MultiLineStrings on the map, if the geojson contains MultiLineStrings', function(done) {
      scope.geojsonAggregateData = testData.multiLineStringData4;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

          expect(el.find(featureGeometrySelector).length).to.equal(12+15+6+3);
          done();
        });
    });

    it('should render LineStrings on the map, if the geojson contains LineStrings', function(done) {
      scope.geojsonAggregateData = testData.lineStringData7;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

          expect(el.find(featureGeometrySelector).length).to.equal(7);
          done();
        });
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

    it('should be able to render a legend if the choropleth has values', function(done) {
      scope.geojsonAggregateData = testData.multiLineStringData4;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(legendSelector).length > 0; }).
        then(function() {
          expect(el.find(legendSelector).length).to.equal(1);
          done();
        });
    });

    it('should not render a legend if the choropleth has no values', function(done) {
      scope.geojsonAggregateData = testData.polygonData2NoValues;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

          expect(el.find(legendSelector).children().length).to.equal(0);
          done();
        });
    });

    it('should render proper map features, legend, and legend labels for 1 line feature', function(done) {
      // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
      var expanded = true;
      scope.geojsonAggregateData = testData.lineStringData1;
      el = createChoropleth(expanded);

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

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
          done();
        });
    });

    it('should render proper map features, legend, and legend labels for 1 polygon feature', function(done) {
      // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
      var expanded = true;
      scope.geojsonAggregateData = testData.polygonData1;
      el = createChoropleth(expanded);

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

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
          done();
        });
    });

    it('should render proper map features, legend, and legend labels for 2 features', function(done) {
      // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
      var expanded = true;
      scope.geojsonAggregateData = testData.polygonData2;
      el = createChoropleth(expanded);

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

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
          done();
        });
    });

    it('should render proper map features, legend, and legend labels for 3 features', function(done) {
      // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
      var expanded = true;
      scope.geojsonAggregateData = testData.lineStringData3;
      el = createChoropleth(expanded);

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

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
          done();
        });
    });

    it('should render proper map features, legend, and legend labels for many features', function(done) {
      scope.geojsonAggregateData = testData.lineStringData52;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

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
          done();
        });
    });

    it('should not color features that are missing properties', function(done) {
      scope.geojsonAggregateData = testData.polygonData2PropertyMissing;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

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
          done();
        });
    });

    it('should not color features that have null values', function(done){
      scope.geojsonAggregateData = testData.polygonData2ValueNull;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

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

          done();
        });
    });

    it('should not color features that have undefined values', function(done){
      scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

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

          done();
        });
    });

    /* ---- DOUBLE CLICK EFFECTS ---- */

    //TODO find a better way of asserting that leaflet zoomed, like reading zoom level (which we don't
    //currently expose in any way). Right now reading the animation class doesn't work, and is an evil
    //thing anyway. (APPLIES TO THE FOLLOWING TWO TESTS).
    xit('should zoom the map if a map tile was double clicked', function(done) {
      scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

          expect(el.find('.leaflet-map-pane').hasClass('leaflet-zoom-anim')).to.equal(false);
          var tile = el.find('.leaflet-tile')[0];
          testHelpers.fireMouseEvent(tile, 'dblclick');

          testHelpers.waitForSatisfy(function() {
            // map should be zooming
            return el.find('.leaflet-map-pane').hasClass('leaflet-zoom-anim');
          }).then(done);
        });
    });

    xit('should zoom the map if a choropleth feature was double clicked', function(done) {
      scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

          expect(el.find('.leaflet-map-pane').hasClass('leaflet-zoom-anim')).to.equal(false);
          
          var polygon = el.find('path')[0];
          testHelpers.fireMouseEvent(polygon, 'dblclick');
          timeout.flush();

          setTimeout(function() {
            // map should be zooming
            expect(el.find('.leaflet-map-pane').hasClass('leaflet-zoom-anim')).to.equal(true);
            done();
          }, 100);
        });
    });

    it('should preserve the styles on a highlighted feature if the highlighted feature was double clicked', function(done) {
      scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {
          var polygon = el.find('path')[0];
          var defaultStrokeWidth = parseInt($(polygon).css('strokeWidth'));

          testHelpers.fireMouseEvent(polygon, 'dblclick');

          setTimeout(function() {
            // polygon should not be highlighted
            var strokeWidth = parseInt($(polygon).css('strokeWidth'));
            expect(strokeWidth).to.equal(defaultStrokeWidth);
            done();
          }, 400);
        });
    });

    /* ---- MOUSEOVER EVENTS -------------------------------- */

    it('should toggle highlight on an unfiltered region on mouseover and mouseout', function(done) {
      scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
      el = createChoropleth();

      testHelpers.
        waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
        then(function() {

          var feature = $(el).find(featureGeometrySelector)[0];
          var defaultStrokeWidth = parseInt($(feature).css('strokeWidth'));

          testHelpers.fireMouseEvent(feature, 'mouseover');
          testHelpers.fireMouseEvent(feature, 'mousemove');

          // mouseover should highlight feature by amplifying stroke width
          var highlightedStrokeWidth = parseInt($(feature).css('strokeWidth'));
          expect(highlightedStrokeWidth).to.be.above(defaultStrokeWidth);

          testHelpers.fireMouseEvent(feature, 'mouseout');
          var unhighlightedStrokeWidth = parseInt($(feature).css('strokeWidth'));
          expect(unhighlightedStrokeWidth).to.equal(defaultStrokeWidth);
          done();
        });
    });

    /* ---- FILTERING EVENTS -------------------------------- */

    describe('on clicking a region', function(){
      // TODO: UNSUCCESSFUL FILTERING?


      it('should signal the region to toggle in the active filter names', function(done) {
        scope.geojsonAggregateData = testData.polygonData2;
        el = createChoropleth();

        testHelpers.
          waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
          then(function() {
            var polygon = el.find('path')[0];
            var secondLine = el.find('path')[1];
            var defaultStrokeWidth = parseInt($(polygon).css('strokeWidth'));
            var toggleFilterByRegionEventReceived = false;

            scope.$on('toggle-dataset-filter:choropleth', function() {
              toggleFilterByRegionEventReceived = true;
            });

            testHelpers.fireMouseEvent(polygon, 'click');

            timeout.flush(); // click promise (lastTimer on geojsonClick in Choropleth.js)

            expect(toggleFilterByRegionEventReceived).to.equal(true);
            done();
          });
        });
    });


    /*    LEGEND     */
    describe('legend', function() {

      describe('on an unexpanded card', function() {

        var expanded = false;

        it('should contain labels that are evenly spaced numbers', function(done) {
          scope.geojsonAggregateData = testData.polygonData2;
          el = createChoropleth(expanded);

          testHelpers.
            waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
            then(function() {

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
              done();
            });
        });

        it('should show a flyout with text upon hover over a legend color', function(done) {
          scope.geojsonAggregateData = testData.polygonData2;
          el = createChoropleth(expanded);

          testHelpers.
            waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
            then(function() {

              var legendColor = el.find(legendColorSelector)[0];
              var legendColorFlyoutText = $(legendColor).data('flyout-text');
              testHelpers.fireMouseEvent(legendColor, 'mouseover');
              var $flyout = $('.flyout');
              expect($flyout.is(':visible')).to.equal(true);
              expect($flyout.text()).to.equal(legendColorFlyoutText);
              done();
            });
        });

        it('should contain labels that are not rounded for small enough legend class breaks', function(done){
          // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
          scope.geojsonAggregateData = testData.lineStringData3SmallNumbers;
          el = createChoropleth(expanded);

          testHelpers.
            waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
            then(function() {

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
              done();
            });
        });
      });

      describe('on an expanded card', function() {

        var expanded = true;

        it('should contain labels that are evenly spaced numbers', function(done) {
          scope.geojsonAggregateData = testData.polygonData2;
          el = createChoropleth(expanded);

          testHelpers.
            waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
            then(function() {

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
              done();
            });
        });

        it('should show a flyout with text upon hover over a legend color', function(done) {
          scope.geojsonAggregateData = testData.polygonData2;
          el = createChoropleth(expanded);

          testHelpers.
            waitForSatisfy(function() { return $('.choropleth-legend').length > 0; }).
            then(function() {
              var legendColor = el.find(legendColorSelector)[0];
              var legendColorFlyoutText = $(legendColor).data('flyout-text');
              testHelpers.fireMouseEvent(legendColor, 'mouseover');
              var $flyout = $('.flyout');
              expect($flyout.is(':visible')).to.equal(true);
              expect($flyout.text()).to.equal(legendColorFlyoutText);
              done();
            });
        });

        it('should contain labels that are not rounded for small enough legend class breaks', function(done){
          // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
          scope.geojsonAggregateData = testData.lineStringData3SmallNumbers;
          el = createChoropleth(expanded);

          testHelpers.
            waitForSatisfy(function() { return el.find(featureGeometrySelector).length > 0; }).
            then(function() {

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
              done();
            });
        });
      });
    });
  });
});
