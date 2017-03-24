const angular = require('angular');

describe('HistogramService', function() {
  'use strict';

  var HistogramService;
  var Constants;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    HistogramService = $injector.get('HistogramService');
    Constants = $injector.get('Constants');
  }));

  describe('getBucketingOptions', function() {

    var threshold;

    beforeEach(function() {
      threshold = Constants.HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD;
    });

    function run(input) {
      return HistogramService.getBucketingOptions(input);
    }

    describe('input handling', function() {
      it('should throw an error if no input is provided', function() {
        expect(_.wrap(undefined, run)).to.throw();
        expect(_.wrap(null, run)).to.throw();
      });

      it('should throw an error if the input object does not have min and max keys', function() {
        var input = {color: 'purple'};
        expect(_.wrap(input, run)).to.throw();
      });

      it('should throw an error if either the min or the max is NaN', function() {
        var input;

        input = {min: NaN, max: 19};
        expect(_.wrap(input, run)).to.throw();

        input = {min: -19, max: NaN};
        expect(_.wrap(input, run)).to.throw();
      });

      it('should throw an error if either the min or the max is Infinity', function() {
        var input;

        input = {min: -Infinity, max: 19};
        expect(_.wrap(input, run)).to.throw();

        input = {min: 0, max: Infinity};
        expect(_.wrap(input, run)).to.throw();
      });
    });

    describe('bucketType computation', function() {
      it('should select the correct bucketType based on the threshold value', function() {
        var input;

        // Minimum is not below the threshold
        input = {min: -threshold + 1, max: 0};
        input = run(input);
        expect(input.bucketType).to.equal('linear');

        // Minimum is below the threshold
        input = {min: -threshold, max: 0};
        input = run(input);
        expect(input.bucketType).to.equal('logarithmic');

        // Maximum does not exceed the threshold
        input = {min: 0, max: threshold - 1};
        input = run(input);
        expect(input.bucketType).to.equal('linear');

        // Maximum exceeds the threshold
        input = {min: 0, max: threshold};
        input = run(input);
        expect(input.bucketType).to.equal('logarithmic');

        // Both exceed the threshold
        input = {min: -threshold, max: threshold};
        input = run(input);
        expect(input.bucketType).to.equal('logarithmic');
      });
    });

    describe('bucketSize computation', function() {
      it('should not add a bucketSize key if the bucketType is "logarithmic"', function() {
        var input;

        input = {min: -threshold, max: threshold};
        input = run(input);
        expect(input.bucketType).to.equal('logarithmic');
        expect(input.bucketSize).to.not.exist;
      });

      it('should default to a bucketSize of one if the range is empty', function() {
        var input = {min: 17, max: 17};

        input = run(input);
        expect(input.bucketType).to.equal('linear');
        expect(input.bucketSize).to.equal(1);
      });

      it('should return approximately twenty buckets in various cases', function() {
        var input;

        input = {min: -threshold / 2, max: threshold / 2};
        input = run(input);
        expect(input.bucketType).to.equal('linear');
        expect((input.max - input.min) / input.bucketSize).to.be.closeTo(20, 5);

        input = {min: 0, max: threshold - 1};
        input = run(input);
        expect(input.bucketType).to.equal('linear');
        expect((input.max - input.min) / input.bucketSize).to.be.closeTo(20, 5);

        input = {min: -threshold + 1, max: threshold - 1};
        input = run(input);
        expect(input.bucketType).to.equal('linear');
        expect((input.max - input.min) / input.bucketSize).to.be.closeTo(20, 5);
      });
    });

    describe('edge cases', function() {
      it('should not freak out if the minimum is greater than the maximum', function() {
        var input = {min: threshold, max: -threshold};
        input = run(input);
        expect(input).to.deep.equal({min: threshold, max: -threshold, bucketType: 'logarithmic'});
      });

      it('should not freak out if both the minimum and the maximum are positive', function() {
        var input;

        input = {min: threshold / 2, max: threshold * 2};
        input = run(input);
        expect(input).to.deep.equal({min: threshold / 2, max: threshold * 2, bucketType: 'logarithmic'});

        input = {min: 5, max: 10};
        input = run(input);
        expect(input.bucketType).to.equal('linear');
      });

      it('should not freak out if both the minimum and the maximum are negative', function() {
        var input;

        input = {min: -threshold * 2, max: -threshold / 2};
        input = run(input);
        expect(input).to.deep.equal({min: -threshold * 2, max: -threshold / 2, bucketType: 'logarithmic'});

        input = {min: -10, max: -5};
        input = run(input);
        expect(input.bucketType).to.equal('linear');
      });

      it('should not freak out if both the minimum and maximum are zero', function() {
        var input = {min: 0, max: 0};
        input = run(input);
        expect(input).to.deep.equal({min: 0, max: 0, bucketType: 'linear', bucketSize: 1});
      });
    });
  });

  describe('bucketData', function() {

    var logarithmicOptions = {bucketType: 'logarithmic'};

    function run(input, options) {
      return HistogramService.bucketData(input, options);
    }

    describe('input handling', function() {

      it('should return an empty array if input is an empty array', function() {
        var input, output;

        input = [];
        output = run(input, logarithmicOptions);

        expect(output).to.be.instanceof(Array).and.empty;
      });

      it('should return an empty array if input is not an array', function() {
        var input, output;

        input = null;
        output = run(input, logarithmicOptions);
        expect(output).to.be.instanceof(Array).and.empty;

        input = undefined;
        output = run(input, logarithmicOptions);
        expect(output).to.be.instanceof(Array).and.empty;

        input = 19;
        output = run(input, logarithmicOptions);
        expect(output).to.be.instanceof(Array).and.empty;

        input = 'purpleOatmeal';
        output = run(input, logarithmicOptions);
        expect(output).to.be.instanceof(Array).and.empty;
      });

      it('should return null if linear bucketing is requested without a bucketSize', function() {
        var input, output;
        var options = {bucketType: 'linear'};

        input = ['validipromise'];
        expect(run(input, options)).to.equal(null);
      });

      it('should throw an error if no options are specified', function() {
        var input, output;

        input = ['validipromise'];
        expect(_.wrap(input, run)).to.throw(Error);
      });
    });

    describe('bad data', function() {

      // Replace infinite values with zero to fix problems in
      // HistogramVisualizationService related to rendering of values
      // surrounded by NaNs and/or an infinite loop in the binary search
      // comprising the brush.bisectPath function.
      it('should replace infinite values with zeroes', function() {
        var input, output;

        input = [
          { magnitude: -1, value: NaN },
          { magnitude: 0, value: 0 },
          { magnitude: 1, value: Infinity },
          { magnitude: 2, value: NaN }
        ];

        output = [
          { start: -10, end: 0, value: 0 },
          { start: 0, end: 10, value: 0 },
          { start: 10, end: 100, value: 0 }
        ];

        expect(run(input, logarithmicOptions)).to.deep.equal(output);
      });
    });

    describe('zero bucket behavior', function() {

      it('should return a single bucket if all values are zero', function() {
        var input, output;

        input = [{magnitude: 0, value: 10000}];
        output = run(input, logarithmicOptions);

        expect(output).to.be.instanceof(Array);
        expect(output).to.have.length(1);
        expect(output).to.deep.equal([{start: 0, end: 10, value: 10000}]);
      });

      it('should merge the zero bucket into the bucket with magnitude equal to one, or create one', function() {
        var input, output;

        // mag1 bucket exists, ensure the values are summed.
        input = [{magnitude: 0, value: 2}, {magnitude: 1, value: 3}, {magnitude: 2, value: 4}];
        output = run(input, logarithmicOptions);

        expect(output).to.be.instanceof(Array);
        expect(output).to.have.length(2);
        expect(output).to.deep.equal([{start: 0, end: 10, value: 5}, {start: 10, end: 100, value: 4}]);

        // mag1 bucket does not exist, ensure it is created and has value of zero bucket.
        input = [{magnitude: 0, value: 2}, {magnitude: 2, value: 4}];
        output = run(input, logarithmicOptions);

        expect(output).to.have.length(2);
        expect(output).to.deep.equal([{start: 0, end: 10, value: 2}, {start: 10, end: 100, value: 4}]);
      });
    });

    describe('bucketing', function() {
      describe('when given the logarithmic bucketType', function() {
        it('should create start and end boundaries on powers of 10', function() {
          var input, output;

          input = [
            {magnitude: -2, value: 5},
            {magnitude: -1, value: 5},
            {magnitude: 0, value: 5},
            {magnitude: 1, value: 5},
            {magnitude: 2, value: 5}
          ];

          output = run(input, logarithmicOptions);

          var expectedOutput = [
            {start: -100, end: -10, value: 5},
            {start: -10, end: 0, value: 5},
            {start: 0, end: 10, value: 10},
            {start: 10, end: 100, value: 5}
          ];

          expect(output).to.deep.equal(expectedOutput);
        });

        it('should extend the bucket range up to zero if all buckets are negative', function() {
          var input, output;

          input = [{magnitude: -6, value: 17}, {magnitude: -5, value: 11}];
          output = run(input, logarithmicOptions);

          expect(output.length).to.equal(6);
          expect(_.last(output)).to.deep.equal({start: -10, end: 0, value: 0});
        });

        it('should extend the bucket range down to zero if all buckets are positive', function() {
          var input, output;

          input = [{magnitude: 3, value: 17}, {magnitude: 6, value: 11}];
          output = run(input, logarithmicOptions);

          expect(output.length).to.equal(6);
          expect(_.first(output)).to.deep.equal({start: 0, end: 10, value: 0});
        });
      });

      describe('when given the linear bucketType', function() {
        it('should create start and end boundaries spaced equally according to the bucketSize argument', function() {
          var input, output;

          input = [
            {magnitude: -2, value: 5},
            {magnitude: -1, value: 5},
            {magnitude: 0, value: 5},
            {magnitude: 1, value: 5},
            {magnitude: 2, value: 5}
          ];

          output = run(input, {bucketType: 'linear', bucketSize: 17});

          var expectedOutput = [
            {start: -34, end: -17, value: 5},
            {start: -17, end: 0, value: 5},
            {start: 0, end: 17, value: 10},
            {start: 17, end: 34, value: 5}
          ];

          expect(output).to.deep.equal(expectedOutput);
        });

        it('should extend the bucket range up to zero if all buckets are negative', function() {
          var input, output;

          input = [{magnitude: -6, value: 17}, {magnitude: -5, value: 11}];
          output = run(input, {bucketType: 'linear', bucketSize: 25});

          expect(output.length).to.equal(6);
          expect(_.last(output)).to.deep.equal({start: -25, end: 0, value: 0});
        });

        it('should extend the bucket range down to zero if all buckets are positive', function() {
          var input, output;

          input = [{magnitude: 3, value: 17}, {magnitude: 6, value: 11}];
          output = run(input, {bucketType: 'linear', bucketSize: 25});

          expect(output.length).to.equal(6);
          expect(_.first(output)).to.deep.equal({start: 0, end: 25, value: 0});
        });
      });
    });
  });

  describe('getVisualizationTypeForData', function() {

    var cardinalityThreshold, rangeThreshold;

    beforeEach(function() {
      cardinalityThreshold = Constants.HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD;
      rangeThreshold = Constants.HISTOGRAM_COLUMN_CHART_RANGE_THRESHOLD;
    });

    function generateInput(buckets) {
      return _.isNumber(buckets) ? _.range(0, buckets) : buckets;
    }

    function run(input, output) {
      var result = HistogramService.getVisualizationTypeForData(input);
      expect(result).to.equal(output);
    }

    it('should return "histogram" if the data is empty', function() {
      run([], 'histogram');
    });

    it('should return "histogram" if the data is not an array', function() {
      run(undefined, 'histogram');
      run(null, 'histogram');
      run(NaN, 'histogram');
      run('purple', 'histogram');
      run(-19, 'histogram');
    });

    it('should return "histogram" if the length is above a threshold', function() {
      var input = generateInput(cardinalityThreshold + 1);
      run(input, 'histogram');
    });

    it('should return "histogram" if the length is below a threshold and any of them are floats', function() {
      var input = generateInput(Math.floor(cardinalityThreshold / 2));
      input[0] = .1;
      run(input, 'histogram');
    });

    it('should return "histogram" if the values span a range greater than a threshold', function() {
      var input = generateInput([rangeThreshold, (rangeThreshold * 2) + 1]);
      run(input, 'histogram');
    });

    it('should return "column" if the length is below a threshold and everything is an integer and the values span a range below a threshold', function() {
      var input = generateInput([-4, -1, 0, 1.0, 7, 8, 9, 15]);
      run(input, 'column');
    });
  });

  describe('transformDataForColumnChart', function() {

    function run(unfiltered, filtered, selected, isFiltered, output) {
      expect(HistogramService.transformDataForColumnChart(unfiltered, filtered, selected, isFiltered)).to.deep.equal(output);
    }

    it('should set the filtered values to the unfiltered values if the filtered data is absent and isFiltered is false', function() {
      var unfiltered = [
        { name: 0, value: 17 },
        { name: 1, value: -17 },
        { name: 2, value: 183483 }
      ];

      var output = [
        [ 0, 17, 17, false ],
        [ 1, -17, -17, false ],
        [ 2, 183483, 183483, false ]
      ];

      run(unfiltered, undefined, undefined, undefined, output);
    });

    it('should set the filtered values to zero if they are absent and value is selected', function() {
      var unfiltered = [
        { name: 0, value: 17 },
        { name: 1, value: -17 },
        { name: 2, value: 183483 }
      ];

      var output = [
        [ 0, 17, 0, false ],
        [ 1, -17, 0, false ],
        [ 2, 183483, 0, false ]
      ];

      run(unfiltered, undefined, 100, undefined, output);
    });

    it('should set the filtered values to zero if they are absent and isFiltered is true', function() {
      var unfiltered = [
        { name: 0, value: 17 },
        { name: 1, value: -17 },
        { name: 2, value: 183483 }
      ];

      var output = [
        [ 0, 17, 0, false ],
        [ 1, -17, 0, false ],
        [ 2, 183483, 0, false ]
      ];

      run(unfiltered, undefined, 100, true, output);
    });

    it('should use the filtered values if they are present if selectedValue is absent', function() {
      var unfiltered = [
        { name: 0, value: 17 },
        { name: 1, value: -17 },
        { name: 2, value: 183483 }
      ];

      var filtered = [
        { name: 0, value: 5 },
        { name: 1, value: 5 },
        { name: 2, value: 5 }
      ];

      var output = [
        [ 0, 17, 5, false ],
        [ 1, -17, 5, false ],
        [ 2, 183483, 5, false ]
      ];

      run(unfiltered, filtered, undefined, undefined, output);
    });

    it('should set the filtered values to zero if the bucket name does not equal the selectedValue and the selectedValue is specified', function() {
      var unfiltered = [
        { name: 0, value: 17 },
        { name: 1, value: -17 },
        { name: 2, value: 183483 }
      ];

      var filtered = [
        { name: 0, value: 5 },
        { name: 1, value: 5 },
        { name: 2, value: 5 }
      ];

      var output = [
        [ 0, 17, 0, false ],
        [ 1, -17, 5, true ],
        [ 2, 183483, 0, false ]
      ];

      run(unfiltered, filtered, 1, undefined, output);
    });

    it('should behave well if the selectedValue is weird', function() {
      var unfiltered = [
        { name: 0, value: 17 },
        { name: 1, value: -17 },
        { name: 2, value: 183483 }
      ];

      var filtered = [
        { name: 0, value: 5 },
        { name: 1, value: 5 },
        { name: 2, value: 5 }
      ];

      var output = [
        [ 0, 17, 5, true ],
        [ 1, -17, 0, false ],
        [ 2, 183483, 0, false ]
      ];

      run(unfiltered, filtered, 0, undefined, output);

      output = [
        [ 0, 17, 0, false],
        [ 1, -17, 0, false],
        [ 2, 183483, 0, false ]
      ];

      run(unfiltered, filtered, NaN, undefined, output);
    });

    it('should fill in empty values with zeroes', function() {
      var unfiltered = [
        { name: 0, value: 17 },
        { name: 3, value: -17 },
        { name: 4, value: 183483 }
      ];

      var filtered = [
        { name: 0, value: 5 },
        { name: 3, value: 5 },
        { name: 4, value: 5 }
      ];

      var output = [
        [ 0, 17, 5, true ],
        [ 1, 0, 0, false ],
        [ 2, 0, 0, false ],
        [ 3, -17, 0, false ],
        [ 4, 183483, 0, false ]
      ];

      run(unfiltered, filtered, 0, undefined, output);

      output = [
        [ 0, 17, 0, false ],
        [ 1, 0, 0, false ],
        [ 2, 0, 0, false ],
        [ 3, -17, 0, false ],
        [ 4, 183483, 0, false ]
      ];

      run(unfiltered, filtered, NaN, undefined, output);
    });
  });
});