describe('HistogramVisualizationService', function() {
  'use strict';

  var HistogramVisualizationService;
  var Constants;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.services'));
  beforeEach(inject(function($injector) {
    HistogramVisualizationService = $injector.get('HistogramVisualizationService');
    Constants = $injector.get('Constants');
  }));

  var testData = {
    unfiltered: [
      {start: -100, end: -10, value: 4},
      {start: -10, end: 0, value: 743},
      {start: 0, end: 10, value: 13},
      {start: 10, end: 100, value: 91}
    ],
    selected: [
      {start: -100, end: -10, value: 4},
      {start: -10, end: 0, value: 743},
      {start: 0, end: 10, value: 13},
      {start: 10, end: 100, value: 91}
    ],
    filtered: [
      {start: -100, end: -10, value: 4},
      {start: -10, end: 0, value: 743},
      {start: 0, end: 10, value: 13},
      {start: 10, end: 100, value: 91}
    ]
  };

  var dimensions = {width: 640, height: 480};

  var scale;
  var axis;
  var svg;

  beforeEach(function() {
    scale = HistogramVisualizationService.setupScale();
    axis = HistogramVisualizationService.setupAxis(scale);
    svg = HistogramVisualizationService.setupSVG();
  });

  describe('setupScale', function() {
    it('should return an object with x and y keys', function() {
      expect(scale.x).to.exist;
      expect(scale.y).to.exist;
    });
  });

  describe('setupAxis', function() {
    beforeEach(function() {
      scale = HistogramVisualizationService.setupScale();
      axis = HistogramVisualizationService.setupAxis(scale);
    });

    it('should return an object with x and y keys', function() {
      expect(axis.x).to.exist;
      expect(axis.y).to.exist;
    });

    it('should associate the axes with the appropriate scales', function() {
      expect(axis.x.scale()).to.equal(scale.x);
      expect(axis.y.scale()).to.equal(scale.y);
    });

    it('should orient the axes correctly', function() {
      expect(axis.x.orient()).to.equal('bottom');
      expect(axis.y.orient()).to.equal('left');
    });
  });

  describe('setupSVG', function() {
    it('should create an object with line and area keys for each filter type', function() {
      expect(svg.unfiltered.area).to.exist;
      expect(svg.unfiltered.line).to.exist;
      expect(svg.filtered.area).to.exist;
      expect(svg.filtered.line).to.exist;
    });
  });

  describe('updateScale', function() {
    function updateWithData(data) {
      scale = HistogramVisualizationService.updateScale(scale, data, dimensions);
    }

    it('should be idempotent', function() {
      updateWithData(testData);

      var scaleCopy = {
        x: scale.x.copy(),
        y: scale.y.copy()
      };

      scale = HistogramVisualizationService.updateScale(scale, testData, dimensions);
      scaleCopy = HistogramVisualizationService.updateScale(scaleCopy, testData, dimensions);
      scaleCopy = HistogramVisualizationService.updateScale(scaleCopy, testData, dimensions);
      scaleCopy = HistogramVisualizationService.updateScale(scaleCopy, testData, dimensions);

      expect(scale.x.domain()).to.deep.equal(scaleCopy.x.domain());
      expect(scale.y.domain()).to.deep.equal(scaleCopy.y.domain());
      expect(scale.x.range()).to.deep.equal(scaleCopy.x.range());
      expect(scale.y.range()).to.deep.equal(scaleCopy.y.range());
    });

    it('should set the domain of the x scale to be the union of all start and end keys of the unfiltered data', function() {
      updateWithData(testData);
      var domain = _.union(_.pluck(testData.unfiltered, 'start'), _.pluck(testData.unfiltered, 'end'));
      expect(scale.x.domain()).to.deep.equal(domain);
    });

    it('should set the domain of the y scale to contain the values for both the unfiltered and filtered data', function() {
      var testData = {
        unfiltered: [{start: 0, end: 10, value: -171}, {start: 0, end: 10, value: 31}],
        filtered: [{start: 0, end: 10, value: 131}, {start: 0, end: 10, value: -19}]
      };

      updateWithData(testData);

      expect(scale.y.domain()[0]).to.equal(-171);
      expect(scale.y.domain()[1]).to.equal(131);
    });

    it('should always include zero in the y domain', function() {
      var dataWithOnlyPositives = {
        unfiltered: [{start: 0, end: 10, value: 123456789}, {start: 10, end: 20, value: 987654321}],
        filtered: [{start: 0, end: 10, value: 987654321}, {start: 10, end: 20, value: 123456789}]
      };

      updateWithData(dataWithOnlyPositives);
      expect(scale.y.domain()[0]).to.equal(0);

      var dataWithOnlyNegatives = {
        unfiltered: [{start: 0, end: 10, value: -123456789}, {start: 10, end: 20, value: -987654321}],
        filtered: [{start: 0, end: 10, value: -987654321}, {start: 10, end: 20, value: -123456789}]
      };

      updateWithData(dataWithOnlyNegatives);
      expect(scale.y.domain()[1]).to.equal(0);
    });
  });

  describe('updateSVG', function() {

    function withSVGRenderers(fn) {
      _.each(['filtered', 'unfiltered'], function(filterType) {
        _.each(['area', 'line'], _.curry(fn)(filterType));
      });
    }

    function updateWithData(data) {
      scale = HistogramVisualizationService.updateScale(scale, data, dimensions);
      svg = HistogramVisualizationService.updateSVG(svg, data, scale);
    }

    it('should cause svg renderers to return values of the first and last buckets when passed start and end respectively', function() {
      updateWithData(testData);

      withSVGRenderers(function(filterType, svgType) {
        var leftEdge = svg[filterType][svgType].y()('start');
        var firstValue = scale.y(_.first(testData[filterType]).value);
        expect(leftEdge).to.be.closeTo(firstValue, 1);

        var rightEdge = svg[filterType][svgType].y()('end');
        var lastValue = scale.y(_.last(testData[filterType]).value);
        expect(rightEdge).to.be.closeTo(lastValue, 1);
      });
    });

    it('should cause svg renderers to map nonzero values a few pixels away from the x axis', function() {

      // Exaggerate the scale to be sure that close-to-zero values would get squashed.
      var lopsidedData = {
        unfiltered: [{start: 0, end: 10, value: .0000001}, {start: 10, end: 100, value: 1000000}],
        selected: [{start: 0, end: 10, value: .0000001}, {start: 10, end: 100, value: 1000000}],
        filtered: [{start: 0, end: 10, value: .0000001}, {start: 10, end: 100, value: -1000000}]
      };

      updateWithData(lopsidedData);

      withSVGRenderers(function(filterType, svgType) {
        var transformer = svg[filterType][svgType].y();
        var axis = Math.round(transformer({value: 0}));

        var slightlyAboveAxis = Math.round(transformer({value: .0000001}));
        expect(slightlyAboveAxis).to.not.be.closeTo(axis, Constants.HISTOGRAM_NONZERO_PIXEL_THRESHOLD - 1);

        var slightlyBelowAxis = Math.round(transformer({value: -.0000001}));
        expect(slightlyBelowAxis).to.not.be.closeTo(axis, Constants.HISTOGRAM_NONZERO_PIXEL_THRESHOLD - 1);
      });
    });
  });
});
