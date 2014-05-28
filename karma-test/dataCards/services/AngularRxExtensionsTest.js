describe("Page model", function() {
  var _extensions, _$rootScope;

  beforeEach(module('dataCards.services'));
  beforeEach(inject(function(AngularRxExtensions, $rootScope) {
    _extensions = AngularRxExtensions;
    _$rootScope = $rootScope;
  }));

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
  });
});
