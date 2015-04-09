describe('RX Extensions', function() {
  describe('risingEdge', function() {
    it('should return true for a single-element sequence containing only a true value', function(done) {
      var onlyTrue = Rx.Observable.fromArray([true]);
      onlyTrue.risingEdge().subscribe(function(value) {
        expect(value).to.equal(true);
        done();
      });
    });

    it('should return only one true for a sequence containing only one false-true transition', function() {
      var src = Rx.Observable.fromArray([false, false, true, true, false, false]);
      var sawValue = false;
      src.risingEdge().subscribe(function(value) {
        expect(sawValue).to.equal(false);
        expect(value).to.equal(true);
        sawValue = true;
      });
      expect(sawValue).to.equal(true);
    });

    it('should return an empty sequence if called on an sequence of only false values', function(done) {
      var onlyFalse = Rx.Observable.fromArray([false, false, false, false]);

      onlyFalse.risingEdge().subscribe(
        function() { throw new Error('Did not expect elements'); },
        function() { throw new Error('Did not expect errors'); },
        done
      );
    });
  });

  describe('fallingEdge', function() {
    it('should return false for a single-element sequence containing only a false value', function(done) {
      var onlyFalse = Rx.Observable.fromArray([false]);
      onlyFalse.fallingEdge().subscribe(function(value) {
        expect(value).to.equal(false);
        done();
      });
    });

    it('should return only one false for a sequence containing only one true-false transition', function() {
      var src = Rx.Observable.fromArray([true, true, false, false, true, true]);
      var sawValue = false;
      src.fallingEdge().subscribe(function(value) {
        expect(sawValue).to.equal(false);
        expect(value).to.equal(false);
        sawValue = true;
      });
      expect(sawValue).to.equal(true);
    });

    it('should return an empty sequence if called on an sequence of only true values', function(done) {
      var onlyTrue = Rx.Observable.fromArray([true, true, true, true]);

      onlyTrue.fallingEdge().subscribe(
        function() { throw new Error('Did not expect elements'); },
        function() { throw new Error('Did not expect errors'); },
        done
      );
    });
  });

  describe('debounce', function() {
    it('should return an empty sequence if called on an empty sequence', function(done) {
      var empty = Rx.Observable.empty();
      var debounced = empty.debounce(10);

      debounced.subscribe(
        function() { throw new Error('Did not expect elements'); },
        function() { throw new Error('Did not expect errors'); },
        done
      );
    });

    it('should return the value of a one-element sequence', function(done) {
      var debounced = Rx.Observable.return('foo').debounce(10);

      var seen = null;
      debounced.subscribe(
        function(value) {
          if (seen === null) {
            seen = value;
          } else {
            throw new Error('Got more than one value');
          }
        },
        function() { throw new Error('Did not expect errors'); },
        function() {
          if (seen === null) {
            throw new Error('Expected stream to complete.');
          } else {
            done();
          }
        }
      );
    });

    it('should return the last value of a sequence if all values come in before the timeout', function(done) {
      var numValuesInSequence = 10;
      var debounced = Rx.Observable.range(1, numValuesInSequence).debounce(100);

      var seen = false;
      debounced.subscribe(
        function(value) {
          if (!seen) {
            seen = true;
            expect(value).to.equal(numValuesInSequence);
          } else {
            throw new Error('Got more than one value');
          }
        },
        function() { throw new Error('Did not expect errors'); },
        function() {
          if (seen) {
            done();
          } else {
            throw new Error('Expected stream to complete.');
          }
        }
      );
    });

    it('should return the last values generated before gaps in the sequence longer than the timeout', function(done) {
      var numValuesInRun = 10;

      var ints = Rx.Observable.range(1, numValuesInRun);

      var debounced = Rx.Observable.merge(
        ints,
        ints.delay(200).map(function(num) { return num * 100; })
      ).debounce(100);

      var seenValues = [];
      debounced.subscribe(
        function(value) {
          seenValues.push(value);
        },
        function() { throw new Error('Did not expect errors'); },
        function() {
          expect(seenValues).to.deep.equal([numValuesInRun, numValuesInRun * 100]);
          done();
        }
      );
    });
  });

});
