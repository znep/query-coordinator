describe('Scope RX Extensions', function() {
  'use strict';

  var $rootScope;
  var testHelpers;

  beforeEach(function() {
    module('socrataCommon.decorators');
    module('rx');
    module('test');
  });

  beforeEach(inject(function(_$rootScope_, _testHelpers_) {
    $rootScope = _$rootScope_;
    testHelpers = _testHelpers_;
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('#$destroyAsObservable', function() {
    before(function() {
      angular.module('test').directive('observeDestroyTest', function(rx, $compile) {
        return {
          restrict: 'E',
          scope: {},
          template: '<div></div>',
          link: function($scope, element, attr) {
            // Store it on the element to make sure we're running observe on the correct scope
            element.data('scope', $scope);
            if (attr.withChild) {
              var child = $('<observe-destroy-test />');
              element.append(child);
              $compile(child)($scope);
            }
          }
        };
      });
    });

    describe('without element', function() {
      it('emits on scope destroy event', function() {
        var $scope = $rootScope.$new(true);
        var element = testHelpers.TestDom.compileAndAppend('<observe-destroy-test />', $scope);
        var destroyCount = 0;
        element.data('scope').$destroyAsObservable().subscribe(function() {
          destroyCount++;
        });
        expect(destroyCount).to.equal(0);
        element.data('scope').$destroy();
        expect(destroyCount).to.equal(1);
      });

    });

    describe('with element', function() {
      it('emits on scope destroy event', function() {
        var $scope = $rootScope.$new(true);
        var element = testHelpers.TestDom.compileAndAppend('<observe-destroy-test />', $scope);
        var destroyCount = 0;
        element.data('scope').$destroyAsObservable(element).subscribe(function() {
          destroyCount++;
        });
        expect(destroyCount).to.equal(0);
        element.data('scope').$destroy();
        expect(destroyCount).to.equal(1);
      });

      it('emits on element destroy event', function() {
        var $scope = $rootScope.$new(true);
        var element = testHelpers.TestDom.compileAndAppend('<observe-destroy-test />', $scope);
        var destroyCount = 0;
        element.data('scope').$destroyAsObservable(element).subscribe(function() {
          destroyCount++;
        });
        expect(destroyCount).to.equal(0);
        element.remove();
        expect(destroyCount).to.equal(1);
      });

      it('emits only once', function() {
        var $scope = $rootScope.$new(true);
        var element = testHelpers.TestDom.compileAndAppend('<observe-destroy-test />', $scope);
        var destroyCount = 0;
        element.data('scope').$destroyAsObservable(element).subscribe(function() {
          destroyCount++;
        });
        expect(destroyCount).to.equal(0);
        element.data('scope').$destroy();
        element.remove();
        expect(destroyCount).to.equal(1);
      });

      it('does not emit for child elements\' destroy events', inject(function() {
        var $scope = $rootScope.$new(true);
        var parent = testHelpers.TestDom.compileAndAppend(
          '<observe-destroy-test with-child=true />',
          $scope
        );
        // Make sure there's a child
        var child = parent.find('observe-destroy-test');
        expect(child.length).to.equal(1);
        expect(child.data('scope').$parent).to.equal(parent.data('scope'));

        var destroyCount = 0;
        parent.data('scope').$destroyAsObservable(parent).subscribe(function() {
          destroyCount++;
        });
        var childDestroyCount = 0;
        child.data('scope').$destroyAsObservable(child).subscribe(function() {
          childDestroyCount++;
        });
        expect(childDestroyCount).to.equal(0);

        child.remove();
        expect(childDestroyCount).to.equal(1);
        expect(destroyCount).to.equal(0);
      }));
    });
  });

  describe('#$observe', function() {

    it('should observe scope expressions', function(done) {
      var expectedValues = ['fooValueOne', 'fooValueTwo'];

      var $scope = $rootScope.$new(true);

      $scope.$apply(function() {
        $scope.foo = 'fooValueOne';
      });

      $scope.$observe('foo').
        subscribe(function(val) {
          expect(val).to.equal(expectedValues.shift());
          if (expectedValues.length == 0) {
            done();
          }
        });

      $scope.$digest();

      $scope.$apply(function() {
        $scope.foo = 'fooValueTwo';
      });
    });

  });

  describe('#$emitEventsFromObservable', function() {
    it('should emit events when the observable produces values', function() {
      var eventSpy = sinon.spy();
      var testSubjectName = new Rx.Subject();
      var $scope = $rootScope.$new(true);

      $scope.$on('my-event', eventSpy);
      $scope.$emitEventsFromObservable('my-event', testSubjectName);
      expect(eventSpy).to.have.not.been.called;
      testSubjectName.onNext('value');
      expect(eventSpy).to.have.been.calledWith(sinon.match.any, 'value');
    });
  });

  describe('#$safeApply', function() {
    it('should safely $apply on scope when a digest cycle is in process', function() {
      var $scope = $rootScope.$new(true);
      $scope.$apply(function() {
        $scope.$safeApply(function() {
          $scope.foo = 'bar';
        });
      });
      expect($scope.foo).to.equal('bar');
    });
  });

  describe('#$bindObservable', function() {
    it('should reflect changes inside and outside digest-apply cycles', function() {
      //The Enrichment Center regrets to inform you that this next test is impossible. Make no attempt to solve it.

      var $scope = $rootScope.$new(true);

      var testSubjectName = new Rx.Subject();
      var testSubjectPromisedCake = new Rx.Subject();
      var testSubjectCandescing = new Rx.Subject();

      $scope.$bindObservable('testSubjectName', testSubjectName);
      $scope.$bindObservable('testSubjectPromisedCake', testSubjectPromisedCake);
      $scope.$bindObservable('cake', testSubjectPromisedCake.combineLatest(testSubjectCandescing, function(promised, candescing) {
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
      var $scope = $rootScope.$new(true);
      var testSubject= new Rx.Subject();

      $scope.$bindObservable('testProperty', testSubject, function(err) {
        return 'error:'+err;
      });

      testSubject.onError('fakeError');
      expect($scope.testProperty).to.equal('error:fakeError');
    });

    it('should apply the value returned by onCompleted', function() {
      var $scope = $rootScope.$new(true);
      var testSubject= new Rx.Subject();

      $scope.$bindObservable('testProperty', testSubject, undefined, function() {
        return 'last value';
      });

      testSubject.onCompleted();
      expect($scope.testProperty).to.equal('last value');
    });

    it('should reject bad arguments', function() {
      var $scope = $rootScope.$new(true);

      expect(function() {
        $scope.$bindObservable();
      }).to.throw();

      expect(function() {
        $scope.$bindObservable('string');
      }).to.throw();

      expect(function() {
        $scope.$bindObservable(123, new Rx.Subject());
      }).to.throw();

      expect(function() {
        $scope.$bindObservable('string', 'string');
      }).to.throw();

      expect(function() {
        $scope.$bindObservable('prop', new Rx.Subject(), 1);
      }).to.throw();

      expect(function() {
        $scope.$bindObservable('prop', new Rx.Subject(), function(){}, {});
      }).to.throw();
    });
  });

});
