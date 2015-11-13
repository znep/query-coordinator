describe('RX Extensions', function() {
  'use strict';

  beforeEach(module('rx'));
  beforeEach(inject(function($injector) {
    this.rx = $injector.get('rx');
    this.$rootScope = $injector.get('$rootScope');
  }));

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

  describe('subscribeLatest', function() {
    it('is usable on the prototype', function(done) {
      var observable1$ = new Rx.Subject();
      var observable2$ = new Rx.Subject();
      var observable3$ = new Rx.Subject();
      observable3$.subscribe(function(actual) {
        expect(actual).to.eql(['value1', 'value2', 'value3']);
        done();
      });
      observable1$.subscribeLatest(observable2$, function(value1, value2) {
        expect(value1).to.eq('value1');
        expect(value2).to.eq('value2');
        observable3$.onNext([value1, value2, 'value3']);
      });
      observable2$.onNext('value2');
      observable1$.onNext('value1');
    });
  });

  describe('safeApplyOnError', function() {
    it('does nothing on a normal stream', function(done) {
      var $scope = this.$rootScope.$new(false);
      $scope.myValue = 'yay';
      this.rx.Observable.returnValue('value').
        safeApplyOnError($scope, function() {
          $scope.myValue = 'boo!';
        }).
        subscribe(function() {
          expect($scope.myValue).to.not.eq('boo!');
          expect($scope.myValue).to.eq('yay');
          done();
        });
    });

    it('applies safely on a stream that errors', function(done) {
      var $scope = this.$rootScope.$new(false);
      $scope.myValue = 'yay';
      this.rx.Observable.throwError('error').
        safeApplyOnError($scope, function() {
          $scope.myValue = 'boo!';
        }).
        subscribe(_.noop, function() {
          expect($scope.myValue).to.eq('boo!');
          done();
        });
    });

    it('does not do anything on a normal completion', function(done) {
      var $scope = this.$rootScope.$new(false);
      $scope.myValue = 'yay';
      this.rx.Observable.empty().
        safeApplyOnError($scope, function() {
          $scope.myValue = 'boo!';
        }).
        subscribe(_.noop, _.noop, function() {
          expect($scope.myValue).to.not.eq('boo!');
          expect($scope.myValue).to.eq('yay');
          done();
        });
    });
  });

  describe('safeApplyOnCompleted', function() {
    it('does nothing on a normal stream', function(done) {
      var $scope = this.$rootScope.$new(false);
      $scope.myValue = 'yay';
      this.rx.Observable.returnValue('value').
        safeApplyOnCompleted($scope, function() {
          $scope.myValue = 'complete!';
        }).
        subscribe(function() {
          expect($scope.myValue).to.eq('yay');
          done();
        });
    });

    it('does nothing on a stream that errors', function(done) {
      var $scope = this.$rootScope.$new(false);
      $scope.myValue = 'yay';
      this.rx.Observable.throwError('error').
        safeApplyOnCompleted($scope, function() {
          $scope.myValue = 'complete!';
        }).
        subscribe(_.noop, function() {
          expect($scope.myValue).to.eq('yay');
          done();
        });
    });

    it('safely applies on a stream that completes normally', function(done) {
      var $scope = this.$rootScope.$new(false);
      $scope.myValue = 'yay';
      this.rx.Observable.empty().
        safeApplyOnCompleted($scope, function() {
          $scope.myValue = 'complete!';
        }).
        subscribe(_.noop, _.noop, function() {
          expect($scope.myValue).to.eq('complete!');
          done();
        });
    });
  });

  describe('incrementalFallbackRetry', function() {
    it('does not call the `onRetryStart` argument function if the source does not error', function(done) {
      var src$ = Rx.Observable.fromArray([1, 2, 3]);
      var onRetryStartStub = sinon.stub();
      src$.incrementalFallbackRetry(3, onRetryStartStub).
        subscribe(_.noop, _.noop, function() {
          expect(onRetryStartStub).to.have.not.been.called;
          done();
        });
    });
  });

});
