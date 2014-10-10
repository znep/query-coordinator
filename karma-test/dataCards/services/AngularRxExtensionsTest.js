describe('Angular RX Extensions', function() {
  var _extensions, _$rootScope;

  beforeEach(module('socrataCommon.services'));
  beforeEach(inject(function(AngularRxExtensions, $rootScope) {
    _extensions = AngularRxExtensions;
    _$rootScope = $rootScope;
  }));

  it('should throw if installation would overwrite existing scope keys.', function() {
    var $scope = _$rootScope.$new(true);
    _extensions.install($scope);
    // Re-install should be OK.
    _extensions.install($scope);

    // Try to overwrite existing keys.
    var $scopeWithObserve = _$rootScope.$new(true);
    $scopeWithObserve.observe = function(){};
    expect(function() {
      _extensions.install($scopeWithObserve);
    }).to.throw();

    var $scopeWithBindObservable = _$rootScope.$new(true);
    $scopeWithBindObservable.bindObservable = function(){};
    expect(function() {
      _extensions.install($scopeWithBindObservable);
    }).to.throw();
  });

  it('should observe scope expressions', function(done) {
    var expectedValues = ['fooValueOne', 'fooValueTwo'];

    var $scope = _$rootScope.$new(true);
    _extensions.install($scope);

    $scope.foo = 'fooValueOne';
    $scope.$apply();
    $scope.observe('foo').subscribe(function(val) {
      expect(val).to.equal(expectedValues.shift());
      if (expectedValues.length == 0) {
        done();
      }
    });

    $scope.foo = 'fooValueTwo';
    $scope.$apply();
  });

  describe('bindObservable', function() {
    it('should reflect changes inside and outside digest-apply cycles', function() {
      //The Enrichment Center regrets to inform you that this next test is impossible. Make no attempt to solve it.

      var $scope = _$rootScope.$new(true);
      _extensions.install($scope);

      var testSubjectName = new Rx.Subject();
      var testSubjectPromisedCake = new Rx.Subject();
      var testSubjectCandescing = new Rx.Subject();

      $scope.bindObservable('testSubjectName', testSubjectName);
      $scope.bindObservable('testSubjectPromisedCake', testSubjectPromisedCake);
      $scope.bindObservable('cake', testSubjectPromisedCake.combineLatest(testSubjectCandescing, function(promised, candescing) {
        return promised && candescing; // All RX technologies remain safely operational up to 4000 degrees Kelvin.
      }));

      expect($scope).not.to.have.property('testSubjectName');
      expect($scope).not.to.have.property('testSubjectPromisedCake');
      expect($scope).not.to.have.property('cake');

      $scope.$apply(function() {
        testSubjectName.onNext('Chell');
      });
      expect($scope).to.have.property('testSubjectName').that.equals('Chell');
      expect($scope).not.to.have.property('testSubjectPromisedCake');
      expect($scope).not.to.have.property('cake');

      testSubjectPromisedCake.onNext(true);
      expect($scope).to.have.property('testSubjectName').that.equals('Chell');
      expect($scope).to.have.property('testSubjectPromisedCake').that.is.true;
      expect($scope).not.to.have.property('cake');

      testSubjectCandescing.onNext(true);
      expect($scope).to.have.property('testSubjectName').that.equals('Chell');
      expect($scope).to.have.property('testSubjectPromisedCake').that.is.true;
      expect($scope).to.have.property('cake').that.is.true;
    });

    it('should apply the value returned by onError', function() {
      var $scope = _$rootScope.$new(true);
      _extensions.install($scope);
      var testSubject= new Rx.Subject();

      $scope.bindObservable('testProperty', testSubject, function(err) {
        return 'error:'+err;
      });

      testSubject.onError('fakeError');
      expect($scope.testProperty).to.equal('error:fakeError');
    });

    it('should apply the value returned by onCompleted', function() {
      var $scope = _$rootScope.$new(true);
      _extensions.install($scope);
      var testSubject= new Rx.Subject();

      $scope.bindObservable('testProperty', testSubject, undefined, function() {
        return 'last value';
      });

      testSubject.onCompleted();
      expect($scope.testProperty).to.equal('last value');
    });

    it('should reject bad arguments', function() {
      var $scope = _$rootScope.$new(true);
      _extensions.install($scope);

      expect(function() {
        $scope.bindObservable();
      }).to.throw();

      expect(function() {
        $scope.bindObservable('string');
      }).to.throw();

      expect(function() {
        $scope.bindObservable(123, new Rx.Subject());
      }).to.throw();

      expect(function() {
        $scope.bindObservable('string', 'string');
      }).to.throw();

      expect(function() {
        $scope.bindObservable('prop', new Rx.Subject(), 1);
      }).to.throw();

      expect(function() {
        $scope.bindObservable('prop', new Rx.Subject(), function(){}, {});
      }).to.throw();
    });
  });

  describe('eventToObservable', function() {
    it('should reject bad arguments', function() {
      var $scope = _$rootScope.$new(true);
      _extensions.install($scope);

      expect(function() {
        $scope.eventToObservable();
      }).to.throw();

      expect(function() {
        $scope.eventToObservable(123);
      }).to.throw();

      expect(function() {
        $scope.eventToObservable({});
      }).to.throw();

      expect(function() {
        $scope.eventToObservable([]);
      }).to.throw();

      expect(function() {
        $scope.eventToObservable('');
      }).to.throw();
    });

    it('should translate events', function() {
      var $scope = _$rootScope.$new(true);
      _extensions.install($scope);

      var calls = [];
      $scope.eventToObservable('myEvent').subscribe(function(event) {
        calls.push(event);
      });

      $scope.$emit('myEvent', 'arg1');
      $scope.$emit('myEvent', 'arg2', 'arg3');
      $scope.$emit('myEvent');
      $scope.$emit('myOtherEvent', 123);

      var allArgs = _.pluck(calls, 'args');
      expect(allArgs).to.deep.equal(
        [
          [ 'arg1' ],
          [ 'arg2', 'arg3' ],
          []
        ]
      );

      expect(calls[0].event.name).to.equal('myEvent');
      expect(calls[1].event.name).to.equal('myEvent');
      expect(calls[2].event.name).to.equal('myEvent');

      expect(calls[0].event.targetScope).to.equal($scope);
      expect(calls[1].event.targetScope).to.equal($scope);
      expect(calls[2].event.targetScope).to.equal($scope);
    });
  });
});
