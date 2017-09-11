import { expect, assert } from 'chai';
const angular = require('angular');
const d3 = require('d3');

describe('HistogramVisualizationService', function() {
  'use strict';

  var HistogramVisualizationService;
  var Constants;

  beforeEach(angular.mock.module('dataCards'));

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
      assert.property(scale, 'x');
      assert.property(scale, 'y');
    });
  });

  describe('setupAxis', function() {
    beforeEach(function() {
      scale = HistogramVisualizationService.setupScale();
      axis = HistogramVisualizationService.setupAxis(scale);
    });

    it('should return an object with x and y keys', function() {
      assert.property(axis, 'x');
      assert.property(axis, 'y');
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

  describe('setupBrush', function() {
    var dom;
    var brush;
    beforeEach(function() {
      scale = HistogramVisualizationService.setupScale();
      scale = HistogramVisualizationService.updateScale(scale, testData, dimensions);
      dom = {
        brush: d3.selection()
      };
      brush = HistogramVisualizationService.setupBrush(dom, scale);

    });

    it('should create an object with a D3 brush control, a brushDispatcher, and flyouts', function() {
      assert.property(brush, 'control');
      assert.property(brush, 'brushDispatcher');
      assert.property(brush, 'selectionClearFlyout');
      assert.property(brush, 'brushDragFlyout');
    });

    describe('bisectPath', function() {
      it('should find the center of a path', function() {

        /*

                                                      I................,.7
                                                     7                    +
                                                    I                      ,
                                                   7                        +
                                                   7                         7
                                                  I                           I
                                                  ?                            7
                                                 7                             I
                                                 :                              I
                                                7                                I
                                                ,                                 I
                      ~ ~                      7                                  7
                    7+    7                    =                                   I
                  I        :,                 7                                    ?
                I            ?                I                                     7
               $              ?              7                                      I
             7                 +             7                                       I
            I                   ,           7                                         ?
          ~,                    ,           7                                         7
         7                       +         7                                           +
                                  I        =
                                   I      7
                                    :,   ?
                                      I ?


         */
        var data = [
          [new Date(2001, 0, 1), 1],
          [new Date(2002, 0, 1), 3],
          [new Date(2003, 0, 1), 0],
          [new Date(2004, 0, 1), 6],
          [new Date(2005, 0, 1), 6],
          [new Date(2006, 0, 1), 1]
        ];

        var margin = {top: 20, right: 30, bottom: 30, left: 40},
          width = 960 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

        var x = d3.time.scale()
          .domain([new Date(2001, 0, 1), new Date(2006, 0, 1)])
          .range([0, width]);

        var y = d3.scale.linear()
          .domain([0, 6])
          .range([height, 0]);

        var line = d3.svg.line()
          .interpolate('monotone')
          .x(function(d) { return x(d[0]); })
          .y(function(d) { return y(d[1]); });

        var svg = d3.selection().append('svg')
          .datum(data)
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var path = svg.append('path')
          .attr('class', 'line')
          .attr('d', line);

        // Bottom of chart
        var result = brush.bisectPath(path.node(), (width / 5) * 2);
        expect(result.y).to.be.within(height - 5, height + 5);

        // Top of chart
        result = brush.bisectPath(path.node(), (width / 5) * 3.5);
        expect(result.y).to.be.within(-5, 5);

        // Middle of chart
        result = brush.bisectPath(path.node(), (width / 5) * 2.5);
        var centerPoint = 190; // Found through experimentation
        expect(result.y).to.be.within(centerPoint - 5, centerPoint + 5)
      });
    });

    describe('indexFromPoint', function() {
      it('should return an index given a point', function() {
        var result = brush.indexFromPoint(10);
        expect(result).to.equal(0);
        result = brush.indexFromPoint(dimensions.width / 2);
        expect(result).to.equal(2);
        result = brush.indexFromPoint(dimensions.width - 10);
        expect(result).to.equal(4);
      });
      it('should use the operation if provides', function() {
        var result = brush.indexFromPoint(10, 'ceil');
        expect(result).to.equal(1);
        result = brush.indexFromPoint(dimensions.width - 10, 'floor');
        expect(result).to.equal(3);
      });
    });

    describe('pointFromIndex', function() {
      it('should return a point from an index', function() {
        var result = brush.pointFromIndex(0);
        expect(result).to.equal(0);
        result = brush.pointFromIndex(1);
        var sectionWidth = dimensions.width / 4;
        expect(result).to.equal(sectionWidth);
        result = brush.pointFromIndex(4);
        expect(result).to.equal(dimensions.width);
      });
    });

  });

  describe('setupSVG', function() {
    it('should create an object with line and area keys for each filter type', function() {
      assert.nestedProperty(svg, 'unfiltered.line');
      assert.nestedProperty(svg, 'unfiltered.area');
      assert.nestedProperty(svg, 'filtered.line');
      assert.nestedProperty(svg, 'filtered.area');
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
        y: scale.y.copy(),
        linearX: scale.linearX.copy()
      };

      scale = HistogramVisualizationService.updateScale(scale, testData, dimensions);
      scaleCopy = HistogramVisualizationService.updateScale(scaleCopy, testData, dimensions);
      scaleCopy = HistogramVisualizationService.updateScale(scaleCopy, testData, dimensions);
      scaleCopy = HistogramVisualizationService.updateScale(scaleCopy, testData, dimensions);

      expect(scale.x.domain()).to.deep.equal(scaleCopy.x.domain());
      expect(scale.y.domain()).to.deep.equal(scaleCopy.y.domain());
      expect(scale.linearX.domain()).to.deep.equal(scaleCopy.linearX.domain());
      expect(scale.x.range()).to.deep.equal(scaleCopy.x.range());
      expect(scale.y.range()).to.deep.equal(scaleCopy.y.range());
      expect(scale.linearX.range()).to.deep.equal(scaleCopy.linearX.range());
    });

    it('should set the domain of the x scale to be the union of all start and end keys of the unfiltered data', function() {
      updateWithData(testData);
      var domain = _.union(_.map(testData.unfiltered, 'start'), _.map(testData.unfiltered, 'end'));
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

  describe('updateAxis', function() {
    var defaultDimensions = {width: 640, height: 480};
    var defaultHeight = defaultDimensions.height; // currently y axis does not change in updateAxis

    function setupTestAxis(buckets) {
      dimensions = defaultDimensions;
      scale = HistogramVisualizationService.setupScale();
      scale.x.domain(buckets);
      axis = HistogramVisualizationService.setupAxis(scale);
    }

    function updateWithData(data, testWidth, testHeight) {
      dimensions = {width: testWidth, height: testHeight};
      scale = HistogramVisualizationService.updateScale(scale, data, dimensions);
      axis = HistogramVisualizationService.updateAxis(scale, dimensions, axis);
    }

    function updateWithoutData(testWidth, testHeight) {
      dimensions = {width: testWidth, height: testHeight};
      axis = HistogramVisualizationService.updateAxis(scale, dimensions, axis);
    }

    function calculateLabelSetWidth(xLabelSpec) {
      var labelSet = xLabelSpec.filter(function(isVisible) { return isVisible });
      return Constants.HISTOGRAM_REQUIRED_LABEL_WIDTH * labelSet.length;
    }

    describe('updateAxis using testData', function() {
      var defaultAxisLabels = [-100, -10, 0, 10, 100];
      var allAxisLabels = [true, true, true, true, true]; // [-100, -10, 0, 10, 100]
      var every2Labels = [true, false, true, false, true]; // [-100, 0, 100]
      var every3Labels = [false, false, true, false, false]; // [0]

      var widthOfAllLabels;
      var widthOfEvery2Labels;

      beforeEach(function() {
        setupTestAxis(defaultAxisLabels);
        widthOfAllLabels = calculateLabelSetWidth(allAxisLabels); // 210px
        widthOfEvery2Labels = calculateLabelSetWidth(every2Labels); // 126px
      });

      it('should label every other label when window resizes slightly to small for ' +
        'all labels', function() {
        updateWithData(testData, widthOfAllLabels - 5, defaultHeight);
        expect(axis.xLabels).to.deep.equal(every2Labels);
      });

      it('should label every 3 labels when window resizes significantly', function() {
        updateWithData(testData, widthOfEvery2Labels - 20, defaultHeight);
        expect(axis.xLabels).to.deep.equal(every3Labels);
      });

      it('should include more labels when window grows again', function() {
        updateWithData(testData, widthOfEvery2Labels - 20, defaultHeight);
        updateWithData(testData, defaultDimensions.width, defaultHeight);
        expect(axis.xLabels).to.deep.equal(allAxisLabels);
      });

      it('should not change labels if current labels still fit', function() {
        updateWithData(testData, defaultDimensions.width - 20, defaultHeight);
        expect(axis.xLabels).to.deep.equal(allAxisLabels);
      });
    });

    describe('updateAxis alone (without testData) using enough labels to limit to every 7', function() {
      var defaultAxisLabelsLeft = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      var expectedOutputLeft = {
        allAxisLabels : [true, true, true, true, true, true, true, true, true, true, true,
          true, true, true, true, true],
          // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        every2Labels : [true, false, true, false, true, false, true, false, true, false, true, false,
          true, false, true, false],
          // [0, 2, 4, 6, 8, 10, 12, 14]
        every3Labels : [true, false, false, true, false, false, true, false, false, true, false, false,
          true, false, false, true],
          // [0, 3, 6, 9, 12, 15]
        every5Labels : [true, false, false, false, false, true, false, false, false, false, true,
          false, false, false, false, true],
          // [0, 5, 10, 15]
        every7Labels : [true, false, false, false, false, false, false, true, false, false, false, false,
          false, false, true, false],
          // [0, 7, 14]
        every10Labels: [true, false, false, false, false, false, false, false, false, false, true, false,
          false, false, false, false],
          // [0, 10]
        onlyZero: [true, false, false, false, false, false, false, false, false, false, false, false,
          false, false, false, false]
          // [0]
      };

      var defaultAxisLabelsRight = [-150, -140, -130, -120, -110, -100, -90, -80, -70, -60, -50,
          -40, -30, -20, -10, 0];
      var expectedOutputRight = {
        allAxisLabels : [true, true, true, true, true, true, true, true, true, true, true, true, true, true,
          true, true],
          // [-150, -140, -130, -120, -110, -100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0]
        every2Labels : [false, true, false, true, false, true, false, true, false, true, false, true,
          false, true, false, true],
          // [-140, -120, -100, -80, -60, -40, -20, 0]
        every3Labels : [true, false, false, true, false, false, true, false, false, true, false,
          false, true, false, false, true],
          // [-150, -120, -90, -60, -30, 0]
        every5Labels : [true, false, false, false, false, true, false, false, false, false, true, false,
          false, false, false, true],
          // [-150, -100, -50, 0]
        every7Labels : [false, true, false, false, false, false, false, false, true, false, false, false,
          false, false, false, true],
          // [-140, -70, 0]
        every10Labels : [false, false, false, false, false, true, false, false, false, false, false, false,
          false, false, false, true],
          // [-100, 0]
        onlyZero: [false, false, false, false, false, false, false, false, false, false, false, false, false,
          false, false, true]
          // [0]
      };

      var defaultAxisLabelsMiddle = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8];
      var expectedOutputMiddle = {
        allAxisLabels : [true, true, true, true, true, true, true, true, true, true, true, true, true,
          true, true, true],
          // [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8]
        every2Labels : [false, true, false, true, false, true, false, true, false, true, false, true, false,
          true, false, true],
          // [-6, -4, -2, 0, 2, 4, 6, 8]
        every3Labels : [false, true, false, false, true, false, false, true, false, false, true, false,
          false, true, false, false],
          // [-6, -3, 0, 3, 6]
        every5Labels : [false, false, true, false, false, false, false, true, false, false, false,
          false, true, false, false, false],
          // [-5, 0, 5]
        every7Labels : [true, false, false, false, false, false, false, true, false, false, false,
          false, false, false, true, false],
          // [-7, 0, 7]
        every10Labels : [false, false, false, false, false, false, false, true, false, false, false,
          false, false, false, false, false],
          // [0]
        onlyZero : [false, false, false, false, false, false, false, true, false, false, false,
          false, false, false, false, false]
          // [0]
      };

      var widthOfAllLabels;
      var widthOfEvery2Labels;
      var widthOfEvery3Labels;
      var widthOfEvery5Labels;
      var widthOfEvery7Labels;
      var widthOfEvery10Labels;

      function runTestSetup(currentDefaultLabels, currentExpectedOutput) {
        setupTestAxis(currentDefaultLabels);
        widthOfAllLabels = calculateLabelSetWidth(currentExpectedOutput.allAxisLabels);
        widthOfEvery2Labels = calculateLabelSetWidth(currentExpectedOutput.every2Labels);
        widthOfEvery3Labels = calculateLabelSetWidth(currentExpectedOutput.every3Labels);
        widthOfEvery5Labels = calculateLabelSetWidth(currentExpectedOutput.every5Labels);
        widthOfEvery7Labels = calculateLabelSetWidth(currentExpectedOutput.every7Labels);
        widthOfEvery10Labels = calculateLabelSetWidth(currentExpectedOutput.every10Labels);
      }

      // Runs tests on updateAxis with both decreasing and increasing card window sizes
      // given a set of 16 axis labels and its expected truncated label sets
      var runTestWithSixteenLabels = function(expectedOutput) {

        describe('test decreasing number of ticks labeled', function() {

          it('when wider than width of combined labels, should render all labels', function() {
            updateWithoutData(widthOfAllLabels, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.allAxisLabels);
          });

          it('when smaller than width of combined labels, should start labelling every other tick',
            function() {
            updateWithoutData(widthOfAllLabels - 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.every2Labels);
          });

          it('when smaller than width of every 2 labels, should start labelling every 3 ticks',
            function() {
            updateWithoutData(widthOfEvery2Labels - 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.every3Labels);
          });

          it('when smaller than width of every 3 labels, should start labelling every 5 ticks',
            function() {
            updateWithoutData(widthOfEvery3Labels - 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.every5Labels);
          });

          it('when smaller than width of every 5 labels, should start labelling every 7 ticks, ' +
            'or every 10 ticks if every 7 do not fit (if two label sets are of equal lengths, ' +
            'should skip the second to find a set that fits', function() {
            updateWithoutData(widthOfEvery5Labels - 1, defaultHeight);
            var expectedValues = widthOfEvery5Labels === widthOfEvery7Labels ?
              expectedOutput.every10Labels : expectedOutput.every7Labels;
            expect(axis.xLabels).to.deep.equal(expectedValues);
          });

          it('when smaller than width of every 7 labels, should start labelling every 10 ticks',
            function() {
            updateWithoutData(widthOfEvery7Labels - 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.every10Labels);
          });

          it('when smaller than width of every 10 labels, should just label 0', function() {
            updateWithoutData(widthOfEvery10Labels - 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.onlyZero);
          });

        });

        describe('test increasing number of ticks labeled', function() {
          // ensure each test starts with every 7 labels showing
          beforeEach(function() {
            updateWithoutData(widthOfEvery5Labels - 1, defaultHeight);
          });

          it('Given a width > width of every 10 labels, should start labelling every 10 ticks', function() {
            updateWithoutData(widthOfEvery10Labels + 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.every10Labels);
          });

          it('Given a width > width of every 7 labels, should start labelling every 7 ticks, ' +
            'or every 5 ticks if the width of that set is the same as the prior every 7 label set. ' +
            '(If two label sets are of equal lengths, should skip a label set when increasing)', function() {
            updateWithoutData(widthOfEvery7Labels + 1, defaultHeight);
            var expectedValues = widthOfEvery5Labels === widthOfEvery7Labels ?
              expectedOutput.every5Labels : expectedOutput.every7Labels;
            expect(axis.xLabels).to.deep.equal(expectedValues);
          });

          it('Given a width > width of every 5 labels, should start labelling every 5 ticks', function() {
            updateWithoutData(widthOfEvery5Labels + 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.every5Labels);
          });

          it('Given a width > width of every 3 labels, should start labelling every 3 ticks', function() {
            updateWithoutData(widthOfEvery3Labels + 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.every3Labels);
          });

          it('Given a width > width of every 2 labels, should start labelling every 2 ticks', function() {
            updateWithoutData(widthOfEvery2Labels + 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.every2Labels);
          });

          it('Given a width > width of all labels, should start labelling all ticks', function() {
            updateWithoutData(widthOfAllLabels + 1, defaultHeight);
            expect(axis.xLabels).to.deep.equal(expectedOutput.allAxisLabels);
          });
        });
      };

      describe('test updateAxis without testData when all values are positive (0 is left tick)',
        function() {
        beforeEach(function() {
          runTestSetup(defaultAxisLabelsLeft, expectedOutputLeft)
        });
        runTestWithSixteenLabels(expectedOutputLeft);
      });

      describe('test updateAxis without testData when all values are negative (0 is right tick)',
        function() {
        beforeEach(function() {
          runTestSetup(defaultAxisLabelsRight, expectedOutputRight);
        });
        runTestWithSixteenLabels(expectedOutputRight);
      });

      describe('test updateAxis without testData with positive and negative values (0 is a midpoint)',
        function() {
        beforeEach(function() {
          runTestSetup(defaultAxisLabelsMiddle, expectedOutputMiddle);
        });
        runTestWithSixteenLabels(expectedOutputMiddle);
      });
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
