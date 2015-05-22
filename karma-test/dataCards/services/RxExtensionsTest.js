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

});
