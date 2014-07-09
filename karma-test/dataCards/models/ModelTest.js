describe("Model", function() {
  var Model;

  beforeEach(function() {
    module('dataCards');
  });

  beforeEach(inject(['Model', function(_Model) {
    Model = _Model;
  }]));

  it('should throw when trying to observe, get, or set undeclared props', function() {
    var model = new Model();
    expect(function() { model.observe('bad'); }).to.throw();
    expect(function() { model.getCurrentValue('bad'); }).to.throw();
    expect(function() { model.set('bad', 3); }).to.throw();
  });

  it('should throw when trying to redeclare a property', function() {
    var model = new Model();
    model.defineObservableProperty('myProp', 5);
    expect(model.getCurrentValue('myProp')).to.equal(5);

    expect(function() { model.defineObservableProperty('myProp', 3); }).to.throw();
  });

  it('should reflect changes to property values', function() {
    var model = new Model();
    var seen = [];
    model.defineObservableProperty('myProp', 5);
    model.observe('myProp').subscribe(function(d) {
      seen.push(d);
    });
    expect(model.getCurrentValue('myProp')).to.equal(5);
    expect(seen).to.deep.equal([5]);

    model.set('myProp', 10);
    expect(model.getCurrentValue('myProp')).to.equal(10);
    expect(seen).to.deep.equal([5, 10]);
  });

  it('should honor default value generation with default', inject(function($q, $rootScope) {
    var model = new Model();
    var seen = [];
    var defer = $q.defer();

    function promiseGenerator() {
      return defer.promise;
    };

    model.defineObservableProperty('myProp', 5, promiseGenerator);
    model.observe('myProp').subscribe(function(d) {
      seen.push(d);
    });

    expect(model.getCurrentValue('myProp')).to.equal(5);
    expect(seen).to.deep.equal([5]);

    defer.resolve(10);
    $rootScope.$digest();
    expect(model.getCurrentValue('myProp')).to.equal(10);
    expect(seen).to.deep.equal([5, 10]);
  }));
});
