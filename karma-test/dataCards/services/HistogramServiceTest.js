describe('HistogramService', function() {
  'use strict';

  var HistogramService;

  beforeEach(module('dataCards.services'));
  beforeEach(inject(function($injector) {
    HistogramService = $injector.get('HistogramService');
  }));

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
