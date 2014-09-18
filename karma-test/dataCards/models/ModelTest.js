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
    var promiseGenerated = false;

    function promiseGenerator() {
      promiseGenerated = true;
      return defer.promise;
    };

    model.defineObservableProperty('myProp', 5, promiseGenerator);
    expect(promiseGenerated).to.be.false;
    model.observe('myProp').subscribe(function(d) {
      seen.push(d);
    });
    expect(promiseGenerated).to.be.true;

    expect(model.getCurrentValue('myProp')).to.equal(5);
    expect(seen).to.deep.equal([5]);

    defer.resolve(10);
    $rootScope.$digest();
    expect(model.getCurrentValue('myProp')).to.equal(10);
    expect(seen).to.deep.equal([5, 10]);
  }));

  describe('observeWrites', function() {
    describe('on a non-lazy property', function() {
      it('should emit on property add', function() {
        var model = new Model();
        var changes = [];
        var expectedChanges = [];
        model.observeWrites().subscribe(function(change) {
          changes.push(change);
        });

        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 5
        });
        model.defineObservableProperty('myProp', 5);

        expect(changes).to.deep.equal(expectedChanges);
      });
      it('should emit on set', function() {
        var model = new Model();
        var changes = [];
        var expectedChanges = [];
        model.defineObservableProperty('myProp', 5);
        model.defineObservableProperty('myProp2', 60);

        model.observeWrites().subscribe(function(change) {
          changes.push(change);
        });

        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp', 6);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 6
        });
        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp2', 100);
        expectedChanges.push({
          model: model,
          property: 'myProp2',
          newValue: 100
        });
        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp', 200);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 200
        });
        expect(changes).to.deep.equal(expectedChanges);
      });
    });

    describe('on a lazy property', function() {
      it('should emit on both the initial value and the lazy value', inject(function($q, $rootScope) {
        var model = new Model();
        var changes = [];
        var expectedChanges = [];
        var defer = $q.defer();
        var generatedPromise = false;

        function promiseGenerator() {
          generatedPromise = true;
          return defer.promise;
        };

        model.observeWrites().subscribe(function(change) {
          changes.push(change);
        });

        expect(changes).to.deep.equal(expectedChanges);

        model.defineObservableProperty('myProp', 5, promiseGenerator);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 5
        });
        expect(changes).to.deep.equal(expectedChanges);

        expect(generatedPromise).to.be.false;

        // Pretend we're interested in using the property.
        model.observe('myProp').subscribe(function(d) {});

        // Still no more updates, as we haven't resolved the promise.
        // However, the promise should be generated.
        expect(generatedPromise).to.be.true;
        expect(changes).to.deep.equal(expectedChanges);

        // Resolve the default. Now we should have a change.
        defer.resolve(10);
        $rootScope.$digest();
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 10
        });
        expect(changes).to.deep.equal(expectedChanges);
      }));

      it('should emit on both the initial value and the set value, if set is called before lazy evaluation completes', inject(function($q, $rootScope) {
        var model = new Model();
        var changes = [];
        var expectedChanges = [];
        var defer = $q.defer();
        var generatedPromise = false;

        function promiseGenerator() {
          generatedPromise = true;
          return defer.promise;
        };

        model.observeWrites().subscribe(function(change) {
          changes.push(change);
        });

        expect(changes).to.deep.equal(expectedChanges);

        model.defineObservableProperty('myProp', 5, promiseGenerator);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 5
        });
        expect(changes).to.deep.equal(expectedChanges);

        expect(generatedPromise).to.be.false;

        // Pretend we're interested in using the property.
        model.observe('myProp').subscribe(function(d) {});

        // Still no more updates, as we haven't resolved the promise.
        // However, the promise should be generated.
        expect(generatedPromise).to.be.true;
        expect(changes).to.deep.equal(expectedChanges);

        // Set the value manually. The change should be reflected.
        model.set('myProp', 200);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 200
        });
        expect(changes).to.deep.equal(expectedChanges);


        // Resolve the default. This should be ignored, as we called set earlier.
        defer.resolve(10);
        $rootScope.$digest();
        expect(model.getCurrentValue('myProp')).to.equal(200); // Value from set() above.
        expect(changes).to.deep.equal(expectedChanges);
      }));
    });
  });

  describe('observeSets', function() {
    describe('on a non-lazy property', function() {
      it('should not emit on property add', function() {
        var model = new Model();
        var changes = [];
        model.observeSets().subscribe(function(change) {
          changes.push(change);
        });

        model.defineObservableProperty('myProp', 5);
        expect(changes).to.have.length(0);
      });
      it('should emit on set', function() {
        var model = new Model();
        var changes = [];
        var expectedChanges = [];
        model.defineObservableProperty('myProp', 5);
        model.defineObservableProperty('myProp2', 60);

        model.observeSets().subscribe(function(change) {
          changes.push(change);
        });

        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp', 6);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 6
        });
        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp2', 100);
        expectedChanges.push({
          model: model,
          property: 'myProp2',
          newValue: 100
        });
        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp', 200);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 200
        });
        expect(changes).to.deep.equal(expectedChanges);
      });
    });

    describe('on a lazy property', function() {
      it('should emit on neither the initial value nor the lazy value', inject(function($q, $rootScope) {
        var model = new Model();
        var changes = [];
        var defer = $q.defer();

        function promiseGenerator() {
          return defer.promise;
        };

        model.observeSets().subscribe(function(change) {
          changes.push(change);
        });

        model.defineObservableProperty('myProp', 5, promiseGenerator);
        // Pretend we're interested in using the property.
        model.observe('myProp').subscribe(function(d) {});

        defer.resolve(10);
        $rootScope.$digest();
        expect(changes).to.have.length(0);
      }));

      it('should emit on only the set value, if set is called before lazy evaluation completes', inject(function($q, $rootScope) {
        var model = new Model();
        var changes = [];
        var expectedChanges = [];
        var defer = $q.defer();

        function promiseGenerator() {
          return defer.promise;
        };

        model.observeSets().subscribe(function(change) {
          changes.push(change);
        });

        model.defineObservableProperty('myProp', 5, promiseGenerator);

        // Pretend we're interested in using the property.
        model.observe('myProp').subscribe(function(d) {});

        // Set the value manually. The change should be reflected.
        model.set('myProp', 200);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 200
        });
        expect(changes).to.deep.equal(expectedChanges);


        // Resolve the default. This should be ignored, as we called set earlier.
        defer.resolve(10);
        $rootScope.$digest();
        expect(model.getCurrentValue('myProp')).to.equal(200); // Value from set() above.
        expect(changes).to.deep.equal(expectedChanges);
      }));
    });
  });
});
