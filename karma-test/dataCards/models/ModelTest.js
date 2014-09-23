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

  describe('observePropertyWrites', function() {
    describe('on a non-lazy property', function() {
      it('should emit on property add', function() {
        var model = new Model();
        var changes = [];
        var expectedChanges = [];
        model.observePropertyWrites().subscribe(function(change) {
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

        model.observePropertyWrites().subscribe(function(change) {
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

        model.observePropertyWrites().subscribe(function(change) {
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

        model.observePropertyWrites().subscribe(function(change) {
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

  describe('observePropertyChanges', function() {
    describe('on a non-lazy property', function() {
      it('should not emit on property add', function() {
        var model = new Model();
        var changes = [];
        model.observePropertyChanges().subscribe(function(change) {
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

        model.observePropertyChanges().subscribe(function(change) {
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

        model.observePropertyChanges().subscribe(function(change) {
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

        model.observePropertyChanges().subscribe(function(change) {
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

  describe('observePropertyChangesRecursively', function() {
    describe('on a single model with no children', function() {
      it('should emit on set', function() {
        var model = new Model();
        var changes = [];
        var expectedChanges = [];
        model.defineObservableProperty('myProp', 5);

        model.observePropertyChangesRecursively().subscribe(function(change) {
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

        model.set('myProp', 200);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          newValue: 200
        });
        expect(changes).to.deep.equal(expectedChanges);
      });
    });

    describe('on a model with one child', function() {
      it('should emit on set on either model', function() {
        var parent = new Model();
        var child = new Model();
        var changes = [];
        var expectedChanges = [];

        parent.defineObservableProperty('propOnParentChild', child);
        parent.defineObservableProperty('propOnParent', 5);
        child.defineObservableProperty('propOnChild', 15);

        parent.observePropertyChangesRecursively().subscribe(function(change) {
          changes.push(change);
        });

        expect(changes).to.deep.equal(expectedChanges);

        parent.set('propOnParent', 6);
        expectedChanges.push({
          model: parent,
          property: 'propOnParent',
          newValue: 6
        });
        expect(changes).to.deep.equal(expectedChanges);

        child.set('propOnChild', 200);
        expectedChanges.push({
          model: child,
          property: 'propOnChild',
          newValue: 200
        });
        expect(changes).to.deep.equal(expectedChanges);
      });

      it('should only emit on the newest model for a given property', function() {
        var parent = new Model();
        var childA = new Model();
        var childB = new Model();
        var changesOnParent = [];
        var expectedChangesOnParent = [];
        var changesOnA = [];
        var changesOnB = [];

        parent.defineObservableProperty('child', childA);

        childA.defineObservableProperty('A', 15);
        childB.defineObservableProperty('B', 16);

        parent.observePropertyChangesRecursively().subscribe(function(change) {
          changesOnParent.push(change);
        });
        childA.observePropertyChangesRecursively().subscribe(function(change) {
          changesOnA.push(change);
        });
        childB.observePropertyChangesRecursively().subscribe(function(change) {
          changesOnB.push(change);
        });

        expect(changesOnParent).to.deep.equal(expectedChangesOnParent);

        parent.set('child', childB);
        expectedChangesOnParent.push({
          model: parent,
          property: 'child',
          newValue: childB
        });
        expect(changesOnParent).to.deep.equal(expectedChangesOnParent);

        childA.set('A', 200);
        childB.set('B', 300);

        expectedChangesOnParent.push({
          model: childB,
          property: 'B',
          newValue: 300
        });
        expect(changesOnParent).to.deep.equal(expectedChangesOnParent);

        // Ensure that the children themselves also got the correct notifications.
        expect(changesOnA).to.deep.equal([ {
          model: childA,
          property: 'A',
          newValue: 200
        }]);
        expect(changesOnB).to.deep.equal([ {
          model: childB,
          property: 'B',
          newValue: 300
        }]);

      });


      it('should provide events on arrays of models', function() {
        var parent = new Model();
        var changes = [];
        var expectedChanges = [];

        parent.defineObservableProperty('children', []);

        parent.observePropertyChangesRecursively().subscribe(function(change) {
          changes.push(change);
        });

        expect(changes).to.deep.equal(expectedChanges);

        function make() {
          var m = new Model();
          m.defineObservableProperty('testProp', null);
          return m;
        };

        var childrenA = _.times(10, make);

        // Set child array. Expect notification from parent.
        parent.set('children', childrenA);
        expectedChanges.push({
          model: parent,
          property: 'children',
          newValue: childrenA
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Set properties on children. Expect notifications.
        _.each(childrenA, function(child, index) {
          child.set('testProp', index);
          expectedChanges.push({
            model: child,
            property: 'testProp',
            newValue: index
          });
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Set child array again, with new models. Expect notification from parent.
        var childrenB = _.times(10, make);
        parent.set('children', childrenB);
        expectedChanges.push({
          model: parent,
          property: 'children',
          newValue: childrenB
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Set properties on BOTH sets of children. Expect notification ONLY on B.
        _.invoke(childrenA, 'set', 'testProp', 'badvalue');

        _.each(childrenB, function(child, index) {
          child.set('testProp', index * 100);
          expectedChanges.push({
            model: child,
            property: 'testProp',
            newValue: index * 100
          });
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Set child array with one child from sets A and B each. Expect notification from parent.
        var firstChildrenFromAAndB = [ childrenA[0], childrenB[0] ]; 

        parent.set('children', firstChildrenFromAAndB);
        expectedChanges.push({
          model: parent,
          property: 'children',
          newValue: firstChildrenFromAAndB
        });
        expect(changes).to.deep.equal(expectedChanges);

        childrenA[0].set('testProp', 'gooda');
        childrenA[1].set('testProp', 'bada');
        childrenB[0].set('testProp', 'goodb');
        childrenB[1].set('testProp', 'badb');
        expectedChanges.push({
          model: childrenA[0],
          property: 'testProp',
          newValue: 'gooda'
        });
        expectedChanges.push({
          model: childrenB[0],
          property: 'testProp',
          newValue: 'goodb'
        });
        expect(changes).to.deep.equal(expectedChanges);
      });

      it('should correctly handle non-models set on properties', function() {
        var parent = new Model();
        var changes = [];
        var expectedChanges = [];

        // Start out with a parent with a child property set to a non-model.
        parent.defineObservableProperty('child', 5);

        parent.observePropertyChangesRecursively().subscribe(function(change) {
          changes.push(change);
        });

        expect(changes).to.deep.equal(expectedChanges);

        // Now set the parent's child to a real model. Expect a notification from the parent.
        var child = new Model();
        child.defineObservableProperty('A', 15);
        parent.set('child', child);
        expectedChanges.push({
          model: parent,
          property: 'child',
          newValue: child
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Set the child's property. Expect a notification from the child.
        child.set('A', 200);
        expectedChanges.push({
          model: child,
          property: 'A',
          newValue: 200
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Unset the parent's child. Expect a notification from the parent.
        parent.set('child', null);
        expectedChanges.push({
          model: parent,
          property: 'child',
          newValue: null
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Now, setting A on the child should not matter.
        child.set('A', 900);
        expect(changes).to.deep.equal(expectedChanges);
      });
    });

    describe('on a deep tree of models', function() {
      it('should emit on set on any model', function() {
        var models = [];
        var changes = [];
        var expectedChanges = [];

        var levelsDeep = 10;

        function make() {
          var m = new Model();
          m.defineObservableProperty('testProp', null);
          m.defineObservableProperty('child', null);
          return m;
        };

        var current = make();
        for(var i = 0; i < levelsDeep; i++) {
          var child = make();
          current.set('child', child);
          current = child;
          models.push(current);
        }

        _.first(models).observePropertyChangesRecursively().subscribe(function(change) {
          changes.push(change);
        });

        expect(changes).to.have.length(0);

        _.each(models, function(model, index) {
          model.set('testProp', index);
          expectedChanges.push({
            model: model,
            property: 'testProp',
            newValue: index
          });
        });

        expect(changes).to.deep.equal(expectedChanges);
      });
    });
  });

  describe('serialize', function() {
    it('should correctly serialize an empty model', function() {
      var model = new Model();
      expect(model.serialize()).to.deep.equal({});
    });
    it('should correctly serialize a model with flat primitives only', function() {
      var model = new Model();
      model.defineObservableProperty('number', 5);
      model.defineObservableProperty('string', 'asd');
      model.defineObservableProperty('undef', undefined);
      model.defineObservableProperty('null', null);
      expect(model.serialize()).to.deep.equal({
        number: 5,
        string: 'asd',
        undef: undefined,
        null: null
      });
    });
    it('should correctly serialize a model with objects and arrays', function() {
      var model = new Model();
      model.defineObservableProperty('array', [5, 6, 7]);
      model.defineObservableProperty('object', { a: 'foo' });
      expect(model.serialize()).to.deep.equal({
        array: [5, 6, 7],
        object: { a: 'foo' }
      });
    });
    it('should throw an exception if a function is encountered as a value', function() {
      var model = new Model();
      model.defineObservableProperty('f', function(){});
      expect(function() { model.serialize(); }).to.throw();
    });
    it('should dive into children as direct values', function() {
      var parent = new Model();
      var child = new Model();
      var grandchild = new Model();
      var greatGrandchild = {
        serialize: _.constant('customSerialization')
      };

      parent.defineObservableProperty('child', child);
      parent.defineObservableProperty('testProp', 5);

      child.defineObservableProperty('child', grandchild);
      child.defineObservableProperty('testProp2', 50);

      grandchild.defineObservableProperty('testProp3', 500);
      grandchild.defineObservableProperty('child', greatGrandchild);
      expect(parent.serialize()).to.deep.equal({
        testProp: 5,
        child: {
          testProp2: 50,
          child: {
            testProp3: 500,
            child: 'customSerialization'
          }
        }
      });
    });
    it('should dive into children in arrays', function() {
      var parent = new Model();
      var childA = new Model();
      var childB = new Model();
      var grandchild = new Model();

      parent.defineObservableProperty('children', [childA, childB]);
      parent.defineObservableProperty('testProp', 5);

      childA.defineObservableProperty('children', [grandchild]);
      childA.defineObservableProperty('testProp2', 50);

      childB.defineObservableProperty('testProp3', 55);

      grandchild.defineObservableProperty('testProp4', 500);
      expect(parent.serialize()).to.deep.equal({
        testProp: 5,
        children: [
          {
            testProp2: 50,
            children: [ { testProp4: 500 } ]
          },
          {
            testProp3: 55
          }
        ]
      });
    });
  });
});
