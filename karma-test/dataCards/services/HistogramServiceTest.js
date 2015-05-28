describe('HistogramService', function() {
  'use strict';

  var HistogramService;
  var Constants;

  beforeEach(module('dataCards.services'));
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
        expect(_.curry(run)).to.throw;
        expect(_.curry(run, null)).to.throw;
      });

      it('should throw an error if the input object does not have min and max keys', function() {
        var input = {color: 'purple'};
        expect(_.curry(run, input)).to.throw;
      });

      it('should throw an error if either the min or the max is NaN', function() {
        var input;

        input = {min: NaN, max: 19};
        expect(_.curry(run, input)).to.throw;

        input = {min: -19, max: NaN};
        expect(_.curry(run, input)).to.throw;
      });

      it('should throw an error if either the min or the max is Infinity', function() {
        var input;

        input = {min: -Infinity, max: 19};
        expect(_.curry(run, input)).to.throw;

        input = {min: 0, max: Infinity};
        expect(_.curry(run, input)).to.throw;
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
        it('should throw an exception if a bucketSize is not specified', function() {
          var input, output;

          input = ['validiswear'];

          expect(_.curry(run)(input, {bucketType: 'linear'})).to.throw;
        });

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
});
