var _ = require('lodash');
var helpers = require('common/visualizations/views/DistributionChartHelpers');

describe('DistributionChartHelpers', function() {

  var fakeProps = {
    margin: {
      top: 5,
      left: 10,
      right: 15,
      bottom: 20
    }
  };

  var fakeEvent = {
    nativeEvent: {
      offsetX: 100
    }
  };

  var fakeData = {
    unfiltered: [
      { start: -10, end: 0, value: -20 },
      { start: 0, end: 10, value: 100 },
      { start: 10, end: 100, value: 30 },
      { start: 100, end: 1000, value: 80 }
    ],
    filtered: [
      { start: -10, end: 0, value: 20 },
      { start: 0, end: 10, value: 30 },
      { start: 10, end: 100, value: 10 },
      { start: 100, end: 1000, value: 80 }
    ]
  };

  var scale;

  beforeEach(function() {
    scale = helpers.getScaleForData(fakeData);
    scale.x.rangeBands([0, 100], 0, -.5);
    scale.y.range([100, 0]);
  });

  describe('clamp', function() {
    it('will throw if given bad input', function() {
      expect(_.partial(helpers.clamp, 'asdf')).to.throw;
      expect(_.partial(helpers.clamp, null)).to.throw;
      expect(_.partial(helpers.clamp, undefined)).to.throw;
      expect(_.partial(helpers.clamp, false)).to.throw;
      expect(_.partial(helpers.clamp, NaN)).to.throw;
    });

    it('clamps the number to the lower bound', function() {
      expect(helpers.clamp(-20, -1, 1)).to.equal(-1);
    });

    it('clamps the number to the upper bound', function() {
      expect(helpers.clamp(20, -1, 1)).to.equal(1);
    });

    it('does not clamp the number if it is within the bound', function() {
      expect(helpers.clamp(0, -1, 1)).to.equal(0);
    });
  });

  describe('translate', function() {
    it('throws if either argument is not a number', function() {
      expect(_.partial(helpers.translate)).to.throw;
      expect(_.partial(helpers.translate, '3px')).to.throw;
      expect(_.partial(helpers.translate, '3em', '3em')).to.throw;
      expect(_.partial(helpers.translate, 3, 3)).to.not.throw;
    });

    it('converts x and y coordinates into a valid transform string', function() {
      expect(helpers.translate(0, 0)).to.equal('translate(0, 0)');
    });
  });

  describe('getMouseOffsetPositon', function() {
    it('subtracts the chart margin from the event mouse position', function() {
      expect(helpers.getMouseOffsetPosition(fakeEvent, fakeProps)).to.equal(fakeEvent.nativeEvent.offsetX - fakeProps.margin.left);
    });
  });

  describe('positionToBucketIndex', function() {
    it('divides the position by the bucket size to determine the index of the bucket', function() {
      expect(helpers.positionToBucketIndex(0, scale)).to.equal(0);
      expect(helpers.positionToBucketIndex(25, scale)).to.equal(1);
      expect(helpers.positionToBucketIndex(50, scale)).to.equal(2);
      expect(helpers.positionToBucketIndex(75, scale)).to.equal(3);
      expect(helpers.positionToBucketIndex(100, scale)).to.equal(4);
    });

    it('floors the position to discretize it by default', function() {
      expect(helpers.positionToBucketIndex(0, scale)).to.equal(0);
      expect(helpers.positionToBucketIndex(5, scale)).to.equal(0);
      expect(helpers.positionToBucketIndex(10, scale)).to.equal(0);
      expect(helpers.positionToBucketIndex(20, scale)).to.equal(0);
      expect(helpers.positionToBucketIndex(25, scale)).to.equal(1);
    });

    it('accepts a custom discretizer as the third argument', function() {
      expect(helpers.positionToBucketIndex(0, scale, Math.ceil)).to.equal(0);
      expect(helpers.positionToBucketIndex(5, scale, Math.ceil)).to.equal(1);
      expect(helpers.positionToBucketIndex(10, scale, Math.ceil)).to.equal(1);
      expect(helpers.positionToBucketIndex(20, scale, Math.ceil)).to.equal(1);
      expect(helpers.positionToBucketIndex(25, scale, Math.ceil)).to.equal(1);
    });

    it('clamps the result to a valid bucket index', function() {
      expect(helpers.positionToBucketIndex(-500, scale)).to.equal(0);
      expect(helpers.positionToBucketIndex(500, scale)).to.equal(4);
    });
  });

  describe('positionToBucket', function() {
    it('maps the bucket index to the value of the bucket', function() {
      expect(helpers.positionToBucket(-500, scale)).to.equal(-10);
      expect(helpers.positionToBucket(0, scale)).to.equal(-10);
      expect(helpers.positionToBucket(25, scale)).to.equal(0);
      expect(helpers.positionToBucket(50, scale)).to.equal(10);
      expect(helpers.positionToBucket(75, scale)).to.equal(100);
      expect(helpers.positionToBucket(100, scale)).to.equal(1000);
    });
  });

  describe('bucketToPosition', function() {
    it('returns the left edge for the special value "start"', function() {
      expect(helpers.bucketToPosition(scale)('start')).to.equal(0);
    });

    it('returns the right edge for the special value "end"', function() {
      expect(helpers.bucketToPosition(scale)('end')).to.equal(100);
    });

    it('returns the pixel value on the x axis for a bucket', function() {
      expect(_.isNumber(helpers.bucketToPosition(scale)({ start: 0, end: 10, value: 5 }))).to.equal(true);
    });
  });

  describe('yCoordinateForBucket', function() {
    it('returns the pixel value on the y axis for the first bucket if "start" is passed to the resulting function', function() {
      var result = helpers.yCoordinateForBucket(scale, fakeData.unfiltered);
      expect(result('start')).to.equal(result(_.head(fakeData.unfiltered)));
    });

    it('returns the pixel value on the y axis for the last bucket if "end" is passed to the resulting function', function() {
      var result = helpers.yCoordinateForBucket(scale, fakeData.unfiltered);
      expect(result('end')).to.equal(result(_.last(fakeData.unfiltered)));
    });

    it('returns a number for the pixel value on the y axis for the bucket if a bucket is passed to the resulting function', function() {
      var result = helpers.yCoordinateForBucket(scale, fakeData.unfiltered);
      expect(_.isNumber(result(_.head(fakeData.unfiltered)))).to.equal(true);
    });
  });

  describe('getTickColor', function() {
    it('returns a different color for the value zero', function() {
      expect(helpers.getTickColor(-5)).to.equal(helpers.getTickColor(100));
      expect(helpers.getTickColor(0)).to.not.equal(helpers.getTickColor(100));
    });
  });

  describe('getXTickAlign', function() {
    it('returns "start" for the first bucket', function() {
      expect(helpers.getXTickAlign(-10, scale)).to.equal('start');
    });

    it('returns "end" for the first bucket', function() {
      expect(helpers.getXTickAlign(1000, scale)).to.equal('end');
    });

    it('returns "middle" for other buckets', function() {
      expect(helpers.getXTickAlign(100, scale)).to.equal('middle');
    });
  });

  describe('getXLabelColor', function() {
    it('returns a different color if a filter is provided', function() {
      expect(helpers.getXLabelColor(10, {})).to.not.equal(helpers.getXLabelColor(10, null));
    });
  });

  describe('getBucketingOptions', function() {
    var threshold = 2000;

    function run(input) {
      return helpers.getBucketingOptions(input);
    }

    describe('input handling', function() {
      it('should throw an error if no input is provided', function() {
        expect(_.partial(run)).to.throw;
        expect(_.partial(run, null)).to.throw;
      });

      it('should throw an error if the input object does not have min and max keys', function() {
        var input = { color: 'purple' };
        expect(_.partial(run, input)).to.throw;
      });

      it('should throw an error if either the min or the max is NaN', function() {
        var input;

        input = { min: NaN, max: 19 };
        expect(_.partial(run, input)).to.throw;

        input = { min: -19, max: NaN };
        expect(_.partial(run, input)).to.throw;
      });

      it('should throw an error if either the min or the max is Infinity', function() {
        var input;

        input = { min: -Infinity, max: 19 };
        expect(_.partial(run, input)).to.throw;

        input = { min: 0, max: Infinity };
        expect(_.partial(run, input)).to.throw;
      });
    });

    describe('bucketType computation', function() {
      it('should select the correct bucketType based on the threshold value', function() {
        var input;
        var result;

        // Minimum is not below the threshold
        input = { min: -threshold + 1, max: 0 };
        result = run(input);
        expect(result.bucketType).to.equal('linear');

        // Minimum is below the threshold
        input = { min: -threshold, max: 0 };
        result = run(input);
        expect(result.bucketType).to.equal('logarithmic');

        // Maximum does not exceed the threshold
        input = { min: 0, max: threshold - 1 };
        result = run(input);
        expect(result.bucketType).to.equal('linear');

        // Maximum exceeds the threshold
        input = { min: 0, max: threshold };
        result = run(input);
        expect(result.bucketType).to.equal('logarithmic');

        // Both exceed the threshold
        input = { min: -threshold, max: threshold };
        result = run(input);
        expect(result.bucketType).to.equal('logarithmic');
      });
    });

    describe('bucketSize computation', function() {
      it('should not add a bucketSize key if the bucketType is "logarithmic"', function() {
        var input;

        input = { min: -threshold, max: threshold };
        var result = run(input);
        expect(result.bucketType).to.equal('logarithmic');
        expect(result.bucketSize).to.not.exist;
      });

      it('should default to a bucketSize of one if the range is empty', function() {
        var input = { min: 17, max: 17 };
        var result;

        result = run(input);
        expect(result.bucketType).to.equal('linear');
        expect(result.bucketSize).to.equal(1);
      });

      it('should return approximately twenty buckets in various cases', function() {
        var input;
        var result;

        input = { min: -threshold / 2, max: threshold / 2 };
        result = run(input);
        expect(result.bucketType).to.equal('linear');
        expect((input.max - input.min) / result.bucketSize).to.be.closeTo(20, 5);

        input = { min: 0, max: threshold - 1 };
        result = run(input);
        expect(result.bucketType).to.equal('linear');
        expect((input.max - input.min) / result.bucketSize).to.be.closeTo(20, 5);

        input = { min: -threshold + 1, max: threshold - 1 };
        result = run(input);
        expect(result.bucketType).to.equal('linear');
        expect((input.max - input.min) / result.bucketSize).to.be.closeTo(20, 5);
      });

      it('should not have floating point rounding issues', function() {
        var input;
        var result;

        input = { min: -1.9, max: 2.3 };
        result = run(input);
        expect(result.bucketType).to.equal('linear');
        expect(result.bucketSize).to.equal(0.2); // and not 0.19999999999999996
      });
    });

    describe('edge cases', function() {
      it('should not freak out if the minimum is greater than the maximum', function() {
        var input = { min: threshold, max: -threshold };
        var result = run(input);
        expect(result).to.deep.equal({ bucketType: 'logarithmic' });
      });

      it('should not freak out if both the minimum and the maximum are positive', function() {
        var input;

        input = { min: threshold / 2, max: threshold * 2 };
        var result = run(input);
        expect(result).to.deep.equal({ bucketType: 'logarithmic' });

        input = { min: 5, max: 10 };
        result = run(input);
        expect(result.bucketType).to.equal('linear');
      });

      it('should not freak out if both the minimum and the maximum are negative', function() {
        var input;
        var result;

        input = { min: -threshold * 2, max: -threshold / 2 };
        result = run(input);
        expect(result).to.deep.equal({ bucketType: 'logarithmic' });

        input = { min: -10, max: -5 };
        result = run(input);
        expect(result.bucketType).to.equal('linear');
      });

      it('should not freak out if both the minimum and maximum are zero', function() {
        var input = { min: 0, max: 0 };
        var result = run(input);
        expect(result).to.deep.equal({ bucketType: 'linear', bucketSize: 1 });
      });
    });
  });

  describe('bucketData', function() {

    var logarithmicOptions = { bucketType: 'logarithmic' };

    function run(input, options) {
      return helpers.bucketData(input, options);
    }

    describe('input handling', function() {

      it('should return an empty array if input is an empty array', function() {
        var input;
        var output;

        input = [];
        output = run(input, logarithmicOptions);

        expect(output).to.be.instanceof(Array).and.empty;
      });

      it('should return an empty array if input is not an array', function() {
        var input;
        var output;

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
        var input;
        var output;
        var options = { bucketType: 'linear' };

        input = ['validipromise'];
        expect(run(input, options)).to.equal(null);
      });

      it('should throw an error if no options are specified', function() {
        var input;
        var output;

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
        var input;
        var output;

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
        var input;
        var output;

        input = [{ magnitude: 0, value: 10000 }];
        output = run(input, logarithmicOptions);

        expect(output).to.be.instanceof(Array);
        expect(output).to.have.length(1);
        expect(output).to.deep.equal([{ start: 0, end: 10, value: 10000 }]);
      });

      it('should merge the zero bucket into the bucket with magnitude equal to one, or create one', function() {
        var input;
        var output;

        // mag1 bucket exists, ensure the values are summed.
        input = [{ magnitude: 0, value: 2 }, { magnitude: 1, value: 3 }, { magnitude: 2, value: 4 }];
        output = run(input, logarithmicOptions);

        expect(output).to.be.instanceof(Array);
        expect(output).to.have.length(2);
        expect(output).to.deep.equal([{ start: 0, end: 10, value: 5 }, { start: 10, end: 100, value: 4 }]);

        // mag1 bucket does not exist, ensure it is created and has value of zero bucket.
        input = [{ magnitude: 0, value: 2 }, { magnitude: 2, value: 4 }];
        output = run(input, logarithmicOptions);

        expect(output).to.have.length(2);
        expect(output).to.deep.equal([{ start: 0, end: 10, value: 2 }, { start: 10, end: 100, value: 4 }]);
      });
    });

    describe('bucketing', function() {
      describe('when given the logarithmic bucketType', function() {
        it('should create start and end boundaries on powers of 10', function() {
          var input;
          var output;

          input = [
            { magnitude: -2, value: 5 },
            { magnitude: -1, value: 5 },
            { magnitude: 0, value: 5 },
            { magnitude: 1, value: 5 },
            { magnitude: 2, value: 5 }
          ];

          output = run(input, logarithmicOptions);

          var expectedOutput = [
            { start: -100, end: -10, value: 5 },
            { start: -10, end: 0, value: 5 },
            { start: 0, end: 10, value: 10 },
            { start: 10, end: 100, value: 5 }
          ];

          expect(output).to.deep.equal(expectedOutput);
        });

        describe('with forceIncludeZero set to true', function() {

          it('should extend the bucket range up to zero if all buckets are negative', function() {
            var input;
            var output;

            input = [{ magnitude: -6, value: 17 }, { magnitude: -5, value: 11 }];
            output = run(input, _.extend({ forceIncludeZero: true }, logarithmicOptions));

            expect(output.length).to.equal(6);
            expect(_.last(output)).to.deep.equal({ start: -10, end: 0, value: 0 });
          });

          it('should extend the bucket range down to zero if all buckets are positive', function() {
            var input;
            var output;

            input = [{ magnitude: 3, value: 17 }, { magnitude: 6, value: 11 }];
            output = run(input, _.extend({ forceIncludeZero: true }, logarithmicOptions));

            expect(output.length).to.equal(6);
            expect(_.head(output)).to.deep.equal({ start: 0, end: 10, value: 0 });
          });
        });

        describe('with forceIncludeZero unset', function() {

          it('should maintain the true bucket range if all buckets are negative', function() {
            var input;
            var output;

            input = [{ magnitude: -6, value: 17 }, { magnitude: -5, value: 11 }];
            output = run(input, logarithmicOptions);

            expect(output).to.deep.equal([
              { start: -1000000, end: -100000, value: 17 },
              { start: -100000, end: -10000, value: 11 }
            ]);
          });

          it('should maintain the true bucket range if all buckets are positive', function() {
            var input;
            var output;

            input = [{ magnitude: 3, value: 17 }, { magnitude: 6, value: 11 }];
            output = run(input, logarithmicOptions);

            expect(output).to.deep.equal([
              { start: 100, end: 1000, value: 17 },
              { start: 1000, end: 10000, value: 0 },
              { start: 10000, end: 100000, value: 0 },
              { start: 100000, end: 1000000, value: 11 }
            ]);
          });
        });
      });

      describe('when given the linear bucketType', function() {
        it('should throw an exception if a bucketSize is not specified', function() {
          var input;
          var output;

          input = ['validiswear'];

          expect(_.curry(run)(input, { bucketType: 'linear' })).to.throw;
        });

        it('should create start and end boundaries spaced equally according to the bucketSize argument', function() {
          var input;
          var output;

          input = [
            { magnitude: -2, value: 5 },
            { magnitude: -1, value: 5 },
            { magnitude: 0, value: 5 },
            { magnitude: 1, value: 5 },
            { magnitude: 2, value: 5 }
          ];

          output = run(input, { bucketType: 'linear', bucketSize: 17 });

          var expectedOutput = [
            { start: -34, end: -17, value: 5 },
            { start: -17, end: 0, value: 5 },
            { start: 0, end: 17, value: 5 },
            { start: 17, end: 34, value: 5 },
            { start: 34, end: 51, value: 5 }
          ];

          expect(output).to.deep.equal(expectedOutput);
        });

        describe('with forceIncludeZero set to true', function() {
          it('should extend the bucket range up to zero if all buckets are negative', function() {
            var input;
            var output;

            input = [
              { magnitude: -6, value: 17 },
              { magnitude: -5, value: 11 }
            ];

            output = run(input, { bucketType: 'linear', forceIncludeZero: true, bucketSize: 25 });

            expect(output.length).to.equal(6);
            expect(_.last(output)).to.deep.equal({ start: -25, end: 0, value: 0 });
          });

          it('should extend the bucket range down to zero if all buckets are positive', function() {
            var input;
            var output;

            input = [{ magnitude: 3, value: 17 }, { magnitude: 6, value: 11 }];
            output = run(input, { bucketType: 'linear', forceIncludeZero: true, bucketSize: 25 });

            expect(output.length).to.equal(7);
            expect(_.head(output)).to.deep.equal({ start: 0, end: 25, value: 0 });
          });
        });

        describe('with forceIncludeZero unset', function() {
          it('should maintain the true bucket range if all buckets are negative', function() {
            var input;
            var output;

            input = [
              { magnitude: -6, value: 17 },
              { magnitude: -5, value: 11 }
            ];

            output = run(input, { bucketType: 'linear', bucketSize: 25 });

            expect(output).to.deep.equal([
              { start: -150, end: -125, value: 17 },
              { start: -125, end: -100, value: 11 }
            ]);
          });

          it('should maintain the true bucket range if all buckets are positive', function() {
            var input;
            var output;

            input = [
              { magnitude: 3, value: 17 },
              { magnitude: 6, value: 11 }
            ];

            output = run(input, { bucketType: 'linear', bucketSize: 25 });

            expect(output).to.deep.equal([
              { start: 75, end: 100, value: 17 },
              { start: 100, end: 125, value: 0 },
              { start: 125, end: 150, value: 0 },
              { start: 150, end: 175, value: 11 }
            ]);
          });

          describe('when bucketSize is 1', function() {
            it('should maintain the true bucket range if all buckets are positive', function() {
              var input;
              var output;

              input = [
                { magnitude: 3, value: 17 },
                { magnitude: 4, value: 21 },
                { magnitude: 5, value: 9 },
                { magnitude: 6, value: 11 }
              ];

              output = run(input, { bucketType: 'linear', bucketSize: 1 });

              expect(output).to.deep.equal([
                { start: 3, end: 4, value: 17 },
                { start: 4, end: 5, value: 21 },
                { start: 5, end: 6, value: 9 },
                { start: 6, end: 7, value: 11 }
              ]);
            });

            it('should maintain the true bucket range if all buckets are negative', function() {
              var input;
              var output;

              input = [
                { magnitude: -4, value: 17 },
                { magnitude: -3, value: 21 },
                { magnitude: -2, value: 9 },
                { magnitude: -1, value: 11 }
              ];

              output = run(input, { bucketType: 'linear', bucketSize: 1 });

              expect(output).to.deep.equal([
                { start: -4, end: -3, value: 17 },
                { start: -3, end: -2, value: 21 },
                { start: -2, end: -1, value: 9 },
                { start: -1, end: 0, value: 11 }
              ]);
            });

            it('should create the correct buckets going from negative to postive', function() {
              var input;
              var output;

              input = [
                { magnitude: -2, value: 17 },
                { magnitude: -1, value: 21 },
                { magnitude: 0, value: 9 },
                { magnitude: 1, value: 11 }
              ];

              output = run(input, { bucketType: 'linear', bucketSize: 1 });

              expect(output).to.deep.equal([
                { start: -2, end: -1, value: 17 },
                { start: -1, end: 0, value: 21 },
                { start: 0, end: 1, value: 9 },
                { start: 1, end: 2, value: 11 }
              ]);
            });
          });
        });
      });
    });
  });
});
