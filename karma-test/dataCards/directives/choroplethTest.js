describe("A Choropleth Directive", function() {
  var testJson  = 'karma-test/dataCards/test-data/choroplethTest/data.json';
  beforeEach(module(testJson));

  var scope, testHelpers, timeout, testData;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    scope = rootScope.$new();
    timeout = $injector.get('$timeout');
    testData = testHelpers.getTestJson(testJson);
  }));

  afterEach(function(){
    testHelpers.TestDom.clear();
  });

  var createChoropleth = function() {
    var html = '<choropleth geojson-aggregate-data="geojsonAggregateData" show-filtered="filterApplied"></choropleth>';
    return testHelpers.TestDom.compileAndAppend(html, scope);
  };

  describe('with a valid geojsonAggregateData input', function() {
    // TODO: INVALID INPUT?

    it('should render a leaflet map, with zoom controls', function() {
      scope.geojsonAggregateData = testData.lineStringData2;
      var el = createChoropleth();

      expect(el.find('.choropleth-map').length).to.equal(1);
      expect(el.find('.leaflet-map-pane').length).to.equal(1);
    });

    it('should render Polygons on the map, if the geojson contains Polygons', function(){
      scope.geojsonAggregateData = testData.polygonData3;
      var el = createChoropleth();

      expect(el.find('g').length).to.equal(3);
    });

    it('should render MultiPolygons on the map, if the geojson contains MultiPolygons', function(){
      scope.geojsonAggregateData = testData.multiPolygonData2;
      var el = createChoropleth();

      expect(el.find('g').length).to.equal(2+3);
    });

    it('should render MultiLineStrings on the map, if the geojson contains MultiLineStrings', function(){
      scope.geojsonAggregateData = testData.multiLineStringData4;
      var el = createChoropleth();

      expect(el.find('.leaflet-overlay-pane svg').find('g').length).to.equal(12+15+6+3);
    });

    it('should render LineStrings on the map, if the geojson contains LineStrings', function(){
      scope.geojsonAggregateData = testData.lineStringData7;
      var el = createChoropleth();

      expect(el.find('.leaflet-overlay-pane svg').find('g').length).to.equal(7);
    });

    xit('should render a map with a bounding box that contains all the features', function(done){
      scope.geojsonAggregateData = testData.easyBoundsData;
      var el = createChoropleth();
      var expectedBounds = {
        northEast: { lat: 2, lng: 2 },
        southWest: { lat: -2, lng: -2 }
      }

      timeout.flush();
      expect(el.isolateScope().bounds).to.equal(expectedBounds);
      done();
      // TODO: timing issues! Fix
    });

    it('should be able to render a legend if the choropleth has values', function(){
      scope.geojsonAggregateData = testData.multiLineStringData4;
      var el = createChoropleth();

      expect(el.find('.leaflet-control.legend').length).to.equal(1);
    });

    it('should not render a legend if the choropleth has no values', function(){
      scope.geojsonAggregateData = testData.polygonData2NoValues;
      var el = createChoropleth();

      expect(el.find('.leaflet-control.legend').length).to.equal(0);
    });

    it('should render proper map features, legend, and legend labels for 1 line feature', function(){
      // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
      scope.geojsonAggregateData = testData.lineStringData1;
      var el = createChoropleth();

      // there should only be 1 feature
      expect(el.find('g').length).to.equal(1);

      // there should only be 1 legend
      expect(el.find('.leaflet-control.legend').length).to.equal(1);

      // there should only be 1 label in the legend
      expect(el.find('.angular-leaflet-map .legend .info-label').length).to.equal(1);
      expect(el.find('.angular-leaflet-map .legend i').length).to.equal(1);

      // legend label should match feature value
      var featureVals = _.map(scope.geojsonAggregateData.features, function(feature){ return Number(feature.properties['__SOCRATA_MERGED_VALUE__']); });
      var legendLabels = _.map(el.find('.angular-leaflet-map .legend .info-label'), function(el){ return Number($(el).text()) });
      expect(featureVals).to.deep.equal(legendLabels);

      // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hex(es) should match legend color hex(es)
      var fillColor = el.find('.angular-leaflet-map svg path').css('stroke');
      var legendLabelColor = el.find('.leaflet-control.legend i').attr('style').replace('background:','');
      expect(chroma.color(fillColor).hex()).to.equal(chroma.color(legendLabelColor).hex());
    });

    it('should render proper map features, legend, and legend labels for 1 polygon feature', function(){
      // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
      scope.geojsonAggregateData = testData.polygonData1;
      var el = createChoropleth();

      // there should only be 1 feature
      expect(el.find('g').length).to.equal(1);

      // there should only be 1 legend
      expect(el.find('.leaflet-control.legend').length).to.equal(1);

      // there should only be 1 label in the legend
      expect(el.find('.angular-leaflet-map .legend .info-label').length).to.equal(1);
      expect(el.find('.angular-leaflet-map .legend i').length).to.equal(1);

      // legend label should match feature value
      var featureVals = _.map(scope.geojsonAggregateData.features, function(feature){ return Number(feature.properties['__SOCRATA_MERGED_VALUE__']); });
      var legendLabels = _.map(el.find('.angular-leaflet-map .legend .info-label'), function(el){ return Number($(el).text()) });
      expect(featureVals).to.deep.equal(legendLabels);

      // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hex(es) should match legend color hex(es)
      var fillColor = el.find('.angular-leaflet-map svg path').css('fill');
      var legendLabelColor = el.find('.leaflet-control.legend i').attr('style').replace('background:','');
      expect(chroma.color(fillColor).hex()).to.equal(chroma.color(legendLabelColor).hex());
    });

    it('should render proper map features, legend, and legend labels for 2 features', function(){
      // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
      scope.geojsonAggregateData = testData.polygonData2;
      var el = createChoropleth();

      // there should only be 2 features
      expect(el.find('g').length).to.equal(2);

      // there should only be 1 legend
      expect(el.find('.leaflet-control.legend').length).to.equal(1);

      // there should only be 2 labels in the legend
      expect(el.find('.angular-leaflet-map .legend .info-label').length).to.equal(2);
      expect(el.find('.angular-leaflet-map .legend i').length).to.equal(2);

      // legend labels should match feature values
      var featureVals = _.map(scope.geojsonAggregateData.features, function(feature){ return Number(feature.properties['__SOCRATA_MERGED_VALUE__']); });
      var legendLabels = _.map(el.find('.angular-leaflet-map .legend .info-label'), function(el){ return Number($(el).text()) });
      expect(featureVals).to.deep.equal(legendLabels);

      // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
      var fillColor = el.find('.angular-leaflet-map svg path').css('fill');
      var legendLabelColor = el.find('.leaflet-control.legend i').attr('style').replace('background:','');
      expect(chroma.color(fillColor).hex()).to.equal(chroma.color(legendLabelColor).hex());
    });

    it('should render proper map features, legend, and legend labels for 3 features', function(){
      // NOTE: important to test for each individual small case (1,2,3) to ensure proper edge case management.
      scope.geojsonAggregateData = testData.lineStringData3;
      var el = createChoropleth();

      // there should only be 3 features
      expect(el.find('g').length).to.equal(3);

      // there should only be 1 legend
      expect(el.find('.leaflet-control.legend').length).to.equal(1);

      // there should only be 3 labels in the legend
      expect(el.find('.angular-leaflet-map .legend .info-label').length).to.equal(3);
      expect(el.find('.angular-leaflet-map .legend i').length).to.equal(3);

      // legend labels should match feature values
      var featureVals = _.map(scope.geojsonAggregateData.features, function(feature){ return Number(feature.properties['__SOCRATA_MERGED_VALUE__']); });
      var legendLabels = _.map(el.find('.angular-leaflet-map .legend .info-label'), function(el){ return Number($(el).text()) });
      expect(featureVals).to.deep.equal(legendLabels);

      // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
      var fillColor = el.find('.angular-leaflet-map svg path').css('stroke');
      var legendLabelColor = el.find('.leaflet-control.legend i').attr('style').replace('background:','');
      expect(chroma.color(fillColor).hex()).to.equal(chroma.color(legendLabelColor).hex());

    });

    it('should render proper map features, legend, and legend labels for many features', function(){
      scope.geojsonAggregateData = testData.lineStringData52;
      var el = createChoropleth();

      // there should only be 51 features
      expect(el.find('g').length).to.equal(52);

      // there should only be 1 legend
      expect(el.find('.leaflet-control.legend').length).to.equal(1);

      // there should only be less than 51 labels in the legend
      expect(el.find('.angular-leaflet-map .legend .info-label').length < 52).to.equal(true);
      expect(el.find('.angular-leaflet-map .legend i').length < 52).to.equal(true);

      // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
      var fillColor = el.find('.angular-leaflet-map svg path').css('stroke');
      var legendLabelColor = el.find('.leaflet-control.legend i').attr('style').replace('background:','');
      expect(chroma.color(fillColor).hex()).to.equal(chroma.color(legendLabelColor).hex());
    });

    it('should not color features that are missing properties', function(){
      scope.geojsonAggregateData = testData.polygonData2PropertyMissing;
      var el = createChoropleth();

      // there should only be 2 features
      expect(el.find('g').length).to.equal(2);

      // there should only be 1 legend with 1 value
      expect(el.find('.leaflet-control.legend').length).to.equal(1);
      expect(el.find('.angular-leaflet-map .legend .info-label').length).to.equal(1);
      expect(el.find('.angular-leaflet-map .legend i').length).to.equal(1);

      // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
      var fillColors = _.map(el.find('.angular-leaflet-map svg path'), function(el){
        var color = $(el).css('fill');
        return chroma.color(color).hex();
      });
      var nullColors = _.filter(fillColors, function(fc){ return chroma.color(fc).hex() == '#dddddd' });
      expect(nullColors.length).to.equal(1);
    });

    it('should not color features that have null values', function(){
      scope.geojsonAggregateData = testData.polygonData2ValueNull;
      var el = createChoropleth();

      // there should only be 2 features
      expect(el.find('g').length).to.equal(2);

      // there should only be 1 legend with 1 value
      expect(el.find('.leaflet-control.legend').length).to.equal(1);
      expect(el.find('.angular-leaflet-map .legend .info-label').length).to.equal(1);
      expect(el.find('.angular-leaflet-map .legend i').length).to.equal(1);

      // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
      var fillColors = _.map(el.find('.angular-leaflet-map svg path'), function(el){
        var color = $(el).css('fill');
        return chroma.color(color).hex();
      });
      var nullColors = _.filter(fillColors, function(fc){ return chroma.color(fc).hex() == '#dddddd' });
      expect(nullColors.length).to.equal(1);
    });

    it('should not color features that have undefined values', function(){
      scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
      var el = createChoropleth();

      // there should only be 2 features
      expect(el.find('g').length).to.equal(2);

      // there should only be 1 legend with 1 value
      expect(el.find('.leaflet-control.legend').length).to.equal(1);
      expect(el.find('.angular-leaflet-map .legend .info-label').length).to.equal(1);
      expect(el.find('.angular-leaflet-map .legend i').length).to.equal(1);

      // stroke (if LineString or MultiLineString) or fill (if Polygon or MultiPolygon) color hexes should match legend color hexes
      var fillColors = _.map(el.find('.angular-leaflet-map svg path'), function(el){
        var color = $(el).css('fill');
        return chroma.color(color).hex();
      });
      var nullColors = _.filter(fillColors, function(fc){ return chroma.color(fc).hex() == '#dddddd' });
      expect(nullColors.length).to.equal(1);
    });

    /* ---- DOUBLE CLICK EFFECTS ---- */

    xit('should zoom the map if the map was double clicked', function(done) {
      scope.geojsonAggregateData = testData.polygonData2ValueUndefined;
      var el = createChoropleth();

      var line = el.find('path')[0];
      var defaultStrokeWidth = parseInt($(line).css('strokeWidth'));

      testHelpers.fireMouseEvent(line, 'dblclick');
      // TODO: test zoom
    });
    xit('should zoom the map if the choropleth was double clicked', function(){
      // TODO
    });
    xit('should zoom the map if a highlighted feature was double clicked', function(){
      // TODO
    });
    xit('should preserve the styles on a highlighted feature if the highlighted feature was double clicked', function(){
      // TODO
    });
    xit('should preserve the styles on an unhighlighted feature if the unhighlighted feature was double clicked', function(){
      // TODO
    });
    xit('should highlight the feature AND zoom in the map if an unhighlighted feature was "slowly" double clicked', function(){
      // TODO
    });
    xit('should unhighlight the feature AND zoom in the map if a highlighted feature was "slowly" double clicked', function(){
      // TODO
    });

    /* ---- FILTERING EVENTS -------------------------------- */

    describe('on clicking a region', function(){
      // TODO: UNSUCCESSFUL FILTERING?


      it('should signal the region to toggle in the active filter names', function(){
        scope.geojsonAggregateData = testData.polygonData2;
        var el = createChoropleth();
        var polygon = el.find('path')[0];
        var secondLine = el.find('path')[1];
        var defaultStrokeWidth = parseInt($(polygon).css('strokeWidth'));
        var toggleFilterByRegionEventReceived = false;

        scope.$on('toggle-dataset-filter:choropleth', function() {
          toggleFilterByRegionEventReceived = true;
        });

        timeout(function() {
          testHelpers.fireMouseEvent(polygon, 'click');
        });

        timeout.flush(); // first polygon click
        timeout.flush(); // click promise (lastTimer on geojsonClick in Choropleth.js)

        expect(toggleFilterByRegionEventReceived).to.equal(true);
      });

    });

  });
});
