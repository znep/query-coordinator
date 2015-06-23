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
      expect(brush.control).to.exist;
      expect(brush.brushDispatcher).to.exist;
      expect(brush.selectionClearFlyout).to.exist;
      expect(brush.brushDragFlyout).to.exist;
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
