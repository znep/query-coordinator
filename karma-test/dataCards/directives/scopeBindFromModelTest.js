describe('scopeBindFromModel directive', function() {
  var Model, $compile, $rootScope;
  beforeEach(module('dataCards'));
  beforeEach(inject(function($injector) {
    Model = $injector.get('Model');
    $compile = $injector.get('$compile');
    $rootScope = $injector.get('$rootScope');
  }));

  it('should throw with invalid keypaths.', function() {
    expect(function() {
      $compile('<div scope-bind-from-model></div>')($rootScope.$new());
    }).to.throw();
    expect(function() {
      $compile('<div scope-bind-from-model="foo"></div>')($rootScope.$new());
    }).to.throw();
  });

  it('should throw an exception if binding against a non-existing property', function() {
    var scope = $rootScope.$new();
    var el = $compile('<div scope-bind-from-model="myModel.propA"></div>')(scope);

    scope.myModel = new Model();

    expect(function() {
      scope.$digest();
    }).to.throw(/propA/);

  });

  it('should throw an exception if binding against something that does not implement observe()', function() {
    var scope = $rootScope.$new();
    var el = $compile('<div scope-bind-from-model="myUnModel.propA"></div>')(scope);

    scope.myUnModel = {};

    expect(function() {
      scope.$digest();
    }).to.throw();
    
  });

  it('should reflect the value of a single model property in the scope', function() {
    var scope = $rootScope.$new();
    var el = $compile('<div scope-bind-from-model="myModel.propA"></div>')(scope);

    var model = new Model();
    model.defineObservableProperty('propA', 5);
    scope.myModel = model;
    scope.$digest();

    // Remember the bindings happen on the inner scope.
    expect(el.scope().propA).to.equal(5);
    model.set('propA', 10);
    expect(el.scope().propA).to.equal(10);
  });

  it('should reflect the value of multiple model properties in the scope', function() {
    var scope = $rootScope.$new();
    var el = $compile('<div scope-bind-from-model="myModel.propA, myModel.propB"></div>')(scope);

    var model = new Model();
    model.defineObservableProperty('propA', 5);
    model.defineObservableProperty('propB', 'a');
    scope.myModel = model;
    scope.$digest();

    // Remember the bindings happen on the inner scope.
    expect(el.scope().propA).to.equal(5);
    expect(el.scope().propB).to.equal('a');
  });

  it('should reflect the value of multiple model properties on multiple models in the scope', function() {
    var scope = $rootScope.$new();
    var el = $compile('<div scope-bind-from-model="myModelA.propA, myModelB.propB"></div>')(scope);

    var modelA = new Model();
    var modelB = new Model();
    modelA.defineObservableProperty('propA', 50);
    modelB.defineObservableProperty('propB', 'fifty');
    scope.myModelA = modelA;
    scope.myModelB = modelB;
    scope.$digest();

    // Remember the bindings happen on the inner scope.
    expect(el.scope().propA).to.equal(50);
    expect(el.scope().propB).to.equal('fifty');
  });

  it('should only bind values from the latest model from the scope', function() {
    var scope = $rootScope.$new();
    var el = $compile('<div scope-bind-from-model="myModel.propA"></div>')(scope);

    var modelA = new Model();
    var modelB = new Model();
    modelA.defineObservableProperty('propA', 10);
    modelB.defineObservableProperty('propA', 'ten');

    scope.myModel = modelA;
    scope.$digest();

    // Remember the bindings happen on the inner scope.
    expect(el.scope().propA).to.equal(10);

    modelA.set('propA', 11);
    modelB.set('propA', 'eleven');
    expect(el.scope().propA).to.equal(11);

    scope.myModel = modelB;
    scope.$digest();

    // Scope should take new model's value.
    expect(el.scope().propA).to.equal('eleven');

    // This should not mess with the scope value.
    modelA.set('propA', 12);
    expect(el.scope().propA).to.equal('eleven');

    modelB.set('propA', 'twelve');
    expect(el.scope().propA).to.equal('twelve');

    // Go back to model A.
    scope.myModel = modelA;
    scope.$digest();

    // Scope should take new model's value.
    expect(el.scope().propA).to.equal(12);

    // This should not mess with the scope value.
    modelB.set('propA', 'thirteen');
    expect(el.scope().propA).to.equal(12);
  });
});
