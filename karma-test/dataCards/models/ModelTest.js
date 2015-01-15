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

  it('should emit the current value on all new subscribers', inject(function($q) {
    var model = new Model();
    var changes = [];
    model.defineObservableProperty('notLazy', 5);
    model.defineObservableProperty('lazy', 15, _.constant($q.defer().promise));

    model.observe('notLazy').subscribe(function(change) {
      changes.push({ a: change });
    });
    model.observe('notLazy').subscribe(function(change) {
      changes.push({ b: change });
    });
    model.observe('lazy').subscribe(function(change) {
      changes.push({ a: change });
    });
    model.observe('lazy').subscribe(function(change) {
      changes.push({ b: change });
    });

    expect(changes).to.deep.equal([
      { a: 5 },
      { b: 5 },
      { a: 15 },
      { b: 15 }
    ]);
  }));

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

  describe('defineReadOnlyObservableProperty', function() {
    it('should reflect changes in the given sequence', function() {
      var model = new Model();
      var valueSeq = new Rx.Subject();
      var seen = [];
      model.defineReadOnlyObservableProperty('prop', valueSeq);
      model.observe('prop').subscribe(function(val) { seen.push(val); });

      expect(model.getCurrentValue('prop')).to.equal(undefined);

      valueSeq.onNext('foo');
      expect(model.getCurrentValue('prop')).to.equal('foo');

      valueSeq.onNext('bar');
      expect(model.getCurrentValue('prop')).to.equal('bar');

      expect(seen).to.deep.equal([ 'foo', 'bar']);
    });

    it('should throw on setValue', function() {
      var model = new Model();
      model.defineReadOnlyObservableProperty('prop', Rx.Observable.never());
      expect(function() { model.setValue('prop'); }).to.throw();
    });

    it('should always return false for isSet', function() {
      var model = new Model();
      model.defineReadOnlyObservableProperty('prop', Rx.Observable.never());
      expect(model.isSet('prop')).to.equal(false);
    });
  });

  describe('observePropertyWrites', function() {
    describe('on a read-only property', function() {
      it('should emit on values', function() {
        var model = new Model();
        var valueSeq = new Rx.Subject();

        var changes = [];
        var expectedChanges = [];
        model.observePropertyWrites().subscribe(function(change) {
          changes.push(change);
        });

        model.defineReadOnlyObservableProperty('prop', valueSeq);
        model.observe('prop').subscribe(_.noop);

        valueSeq.onNext('asd');
        expectedChanges.push({
          model: model,
          property: 'prop',
          oldValue: undefined,
          newValue: 'asd'
        });
        valueSeq.onNext('def');
        expectedChanges.push({
          model: model,
          property: 'prop',
          oldValue: 'asd',
          newValue: 'def'
        });

        expect(changes).to.deep.equal(expectedChanges);
      });
    });

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
          oldValue: undefined,
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
          oldValue: 5,
          newValue: 6
        });
        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp2', 100);
        expectedChanges.push({
          model: model,
          property: 'myProp2',
          oldValue: 60,
          newValue: 100
        });
        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp', 200);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          oldValue: 6,
          newValue: 200
        });
        expect(changes).to.deep.equal(expectedChanges);
      });
    });

    describe('observe', function() {
      it('should work on regular JS properties', function(done) {
        var model = new Model();
        model.someNormalProperty = 'foo';

        model.observe('someNormalProperty').subscribe(function(v) {
          expect(v).to.equal('foo');
          done();
        });
      });

      it('should traverse Models', function(done) {
        var expectedValues = [ 10, 20, 30, 40, 20 ];
        var parent = new Model();
        var child = new Model();
        child.defineObservableProperty('prop', 10);
        parent.defineObservableProperty('child', child);

        parent.observe('child.prop').subscribe(function(v) {
          var expected = expectedValues.shift();
          expect(v).to.equal(expected);

          if (_.isEmpty(expectedValues)) {
            done();
          }
        });

        child.set('prop', 20);

        var child2 = new Model();
        child2.defineObservableProperty('prop', 30);
        parent.set('child', child2);
        child2.set('prop', 40);

        parent.set('child', child);
      });

      it('should throw when traversing Models on an undefined property', function(done) {
        var parent = new Model();
        var child = new Model();
        parent.defineObservableProperty('child', child);

        parent.observe('child.undefinedProp').subscribe(
          function() {
            throw new Error('Should not emit any values');
          },
          function() {
            done();
          }
        );
      });

      it('should wait for properties to become non-undefined and non-null while traversing deep keys', function(done) {
        var parent = new Model();
        var expectedValues = [ 'foo', undefined, 'bar' ];
        var child = new Model();
        child.defineObservableProperty('a', null);
        parent.defineObservableProperty('child', child);

        parent.observe('child.a.b').subscribe(function(v) {
          var expected = expectedValues.shift();
          expect(v).to.equal(expected);

          if (_.isEmpty(expectedValues)) {
            done();
          }
        }, function() { throw new Error('should not error') }, function() { throw new Error('should not complete') });

        child.set('a', undefined);
        child.set('a', {b: 'foo'});

        var grandchild = new Model();
        grandchild.defineObservableProperty('b', undefined);
        child.set('a', grandchild);
        grandchild.set('b', 'bar');
      });

      it('should provide values when leaf values are explicitly undefined or null', function(done) {
        var parent = new Model();
        var expectedValues = [ null, undefined, null, undefined, 5, null];
        var child = new Model();
        child.defineObservableProperty('a', null);
        parent.defineObservableProperty('child', child);

        parent.observe('child.a').subscribe(function(v) {
          var expected = expectedValues.shift();
          expect(v).to.equal(expected);

          if (_.isEmpty(expectedValues)) {
            done();
          }
        }, function() { throw new Error('should not error') }, function() { throw new Error('should not complete') });

        child.set('a', undefined);
        child.set('a', null);
        child.set('a', undefined);
        child.set('a', 5);
        child.set('a', null);
      });

      it('should wait for properties to show up on regular objects while traversing deep keys', function(done) {
        var parent = new Model();
        var expectedValues = [ 'foo', 'bar' ];
        parent.defineObservableProperty('child', {});

        parent.observe('child.a.b').subscribe(function(v) {
          var expected = expectedValues.shift();
          expect(v).to.equal(expected);

          if (_.isEmpty(expectedValues)) {
            done();
          }
        }, function() { throw new Error('should not error') }, function() { throw new Error('should not complete') });

        parent.set('child', {});
        parent.set('child', {a: 4});
        parent.set('child', {a: {}});
        parent.set('child', {a: {b: 'foo'}});
        parent.set('child', {a: {b: 'bar'}});
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
          oldValue: undefined,
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
          oldValue: 5,
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
          oldValue: undefined,
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
          oldValue: 5,
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
    describe('on a read-only property', function() {
      it('should never emit', function() {
        var model = new Model();
        var valueSeq = new Rx.Subject();

        model.observePropertyChanges().subscribe(function() {
          throw new Error('should never see a change for read-only properties');
        });

        model.defineReadOnlyObservableProperty('prop', valueSeq);
        model.observe('prop').subscribe(_.noop);
        valueSeq.onNext('asd');
      });
    });
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
          oldValue: 5,
          newValue: 6
        });
        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp2', 100);
        expectedChanges.push({
          model: model,
          property: 'myProp2',
          oldValue: 60,
          newValue: 100
        });
        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp', 200);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          oldValue: 6,
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
          oldValue: 5,
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
          oldValue: 5,
          newValue: 6
        });
        expect(changes).to.deep.equal(expectedChanges);

        model.set('myProp', 200);
        expectedChanges.push({
          model: model,
          property: 'myProp',
          oldValue: 6,
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
          oldValue: 5,
          newValue: 6
        });
        expect(changes).to.deep.equal(expectedChanges);

        child.set('propOnChild', 200);
        expectedChanges.push({
          model: child,
          property: 'propOnChild',
          oldValue: 15,
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
          oldValue: childA,
          newValue: childB
        });
        expect(changesOnParent).to.deep.equal(expectedChangesOnParent);

        childA.set('A', 200);
        childB.set('B', 300);

        expectedChangesOnParent.push({
          model: childB,
          property: 'B',
          oldValue: 16,
          newValue: 300
        });
        expect(changesOnParent).to.deep.equal(expectedChangesOnParent);

        // Ensure that the children themselves also got the correct notifications.
        expect(changesOnA).to.deep.equal([ {
          model: childA,
          property: 'A',
          oldValue: 15,
          newValue: 200
        }]);
        expect(changesOnB).to.deep.equal([ {
          model: childB,
          property: 'B',
          oldValue: 16,
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
          oldValue: [],
          newValue: childrenA
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Set properties on children. Expect notifications.
        _.each(childrenA, function(child, index) {
          child.set('testProp', index);
          expectedChanges.push({
            model: child,
            property: 'testProp',
            oldValue: null,
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
          oldValue: childrenA,
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
            oldValue: null,
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
          oldValue: childrenB,
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
          oldValue: 'badvalue',
          newValue: 'gooda'
        });
        expectedChanges.push({
          model: childrenB[0],
          property: 'testProp',
          oldValue: 0,
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
          oldValue: 5,
          newValue: child
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Set the child's property. Expect a notification from the child.
        child.set('A', 200);
        expectedChanges.push({
          model: child,
          property: 'A',
          oldValue: 15,
          newValue: 200
        });
        expect(changes).to.deep.equal(expectedChanges);

        // Unset the parent's child. Expect a notification from the parent.
        parent.set('child', null);
        expectedChanges.push({
          model: parent,
          property: 'child',
          oldValue: child,
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
            oldValue: null,
            newValue: index
          });
        });

        expect(changes).to.deep.equal(expectedChanges);
      });
    });
  });

  describe('observeDirtied', function() {
    var model;
    var childModel;
    var childArrayModel;
    var changes;

    beforeEach(function() {
      var ChildModel = Model.extend({
        init: function() {
          this._super();
          this.defineObservableProperty('childfoo', undefined);
        }
      });

      childModel = new ChildModel();
      childArrayModel = new ChildModel();

      model = new (Model.extend({
        init: function() {
          this._super();
          this.defineObservableProperty('foo', null);
          this.defineObservableProperty('childModel', childModel);
          this.defineObservableProperty('childModels', [childArrayModel]);
        }
      }));

      changes = [];
      model.observeDirtied().subscribe(function() {
        changes.push(arguments);
      });
    });

    it('should emit true when a property is changed', function() {
      expect(changes.length).to.equal(0);
      model.set('foo', 'bar');
      expect(changes.length).to.equal(1);
      expect(changes[0][0]).to.equal(true);
    });

    it('should emit true when a property is changed to undefined', function() {
      expect(changes.length).to.equal(0);
      model.set('foo', undefined);
      expect(changes.length).to.equal(1);
      expect(changes[0][0]).to.equal(true);
    });

    it('should emit true when a sub-model has a property changed', function() {
      expect(changes.length).to.equal(0);
      childModel.set('childfoo', 4);
      expect(changes.length).to.equal(1);
      expect(changes[0][0]).to.equal(true);
    });

    it('should emit true when a sub-model within an array has a property changed', function() {
      expect(changes.length).to.equal(0);
      childArrayModel.set('childfoo', null);
      expect(changes.length).to.equal(1);
      expect(changes[0][0]).to.equal(true);
    });

    it('should emit false if I set a property back to its original value', function() {
      expect(changes.length).to.equal(0);
      childArrayModel.set('childfoo', null);
      expect(changes.length).to.equal(1);
      expect(changes[0][0]).to.equal(true);

      childArrayModel.set('childfoo', undefined);
      expect(changes.length).to.equal(2);
      expect(changes[1][0]).to.equal(false);
    });

    it('should emit false if I call resetDirtied', function() {
      expect(changes.length).to.equal(0);
      childArrayModel.set('childfoo', null);
      expect(changes.length).to.equal(1);
      expect(changes[0][0]).to.equal(true);

      model.resetDirtied();
      expect(changes.length).to.equal(2);
      expect(changes[1][0]).to.equal(false);
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
      //TODO see comments in Model to see why we don't support this right now.
      //model.defineObservableProperty('undef', undefined);
      model.defineObservableProperty('null', null);
      expect(model.serialize()).to.deep.equal({
        number: 5,
        string: 'asd',
        //TODO see above.
        //undef: undefined,
        null: null
      });
    });
    it('should not include fields which were never written to', function() {
      var model = new Model();
      model.defineObservableProperty('number', 5);
      model.defineObservableProperty('notDefinedInitially');
      model.defineObservableProperty('null', null);
      expect(model.serialize()).to.deep.equal({
        number: 5,
        null: null
      });
    });
    it('should include fields whose values were not defined initially, but were written to later', function() {
      var model = new Model();
      model.defineObservableProperty('number', 5);
      model.defineObservableProperty('notDefinedInitially');
      model.set('notDefinedInitially', 10);
      expect(model.serialize()).to.deep.equal({
        number: 5,
        notDefinedInitially: 10
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
    it('should not serialize ephemeral fields', function() {
      var model = new Model();
      model.defineObservableProperty('nonEphemeral', 'foo');
      model.defineObservableProperty('ephemeral', 'asd');
      model.setObservablePropertyIsEphemeral('ephemeral', true);

      expect(model.serialize()).to.deep.equal({
        nonEphemeral: 'foo'
      });
    });
  });

  describe('isSet', function() {
    it('should be false for non-lazy properties with no initial value', function() {
      var model = new Model();
      model.defineObservableProperty('noInitialValue');
      expect(model.isSet('noInitialValue')).to.be.false;
    });

    it('should be true for non-lazy properties with an initial value', function() {
      var model = new Model();
      model.defineObservableProperty('initialValue', 5);
      expect(model.isSet('initialValue')).to.be.true;
    });

    it('should become true after calling set() on non-lazy properties with no initial value', function() {
      var model = new Model();
      model.defineObservableProperty('noInitialValue');
      model.set('noInitialValue', 123);
      expect(model.isSet('noInitialValue')).to.be.true;
    });

    it('should become false after calling unset()', function() {
      var model = new Model();
      model.defineObservableProperty('noInitialValue');
      var newestValue = null;
      model.observe('noInitialValue').subscribe(function(val) {
        newestValue = val;
      });

      model.set('noInitialValue', 123);

      expect(model.isSet('noInitialValue')).to.be.true;
      expect(newestValue).to.equal(123);

      model.unset('noInitialValue');

      expect(model.isSet('noInitialValue')).to.be.false;
      // Should still emit
      expect(newestValue).to.equal(undefined);
    });

    it('should be false for lazy properties with no initial value', function() {
      var model = new Model();
      function promiseGenerator() {
        throw new Error('should not be called');
      };

      model.defineObservableProperty('noInitialValue', undefined, promiseGenerator);
      expect(model.isSet('noInitialValue')).to.be.false;
    });

    it('should become true for lazy properties with no initial value when set() is called.', function() {
      var model = new Model();
      function promiseGenerator() {
        throw new Error('should not be called');
      };

      model.defineObservableProperty('noInitialValue', undefined, promiseGenerator);
      model.set('noInitialValue', 'value');
      expect(model.isSet('noInitialValue')).to.be.true;
    });

    it('should be true for lazy properties with an initial value', function() {
      var model = new Model();
      function promiseGenerator() {
        throw new Error('should not be called');
      };

      model.defineObservableProperty('noInitialValue', 'a value', promiseGenerator);
      expect(model.isSet('noInitialValue')).to.be.true;
    });

    it('should become true after the lazy evaluator fulfills for lazy properties with no initial value', function(done) {
      var model = new Model();
      var fulfill;
      var promise = new Promise(function(f){fulfill = f});

      function promiseGenerator() {
        return promise;
      };

      model.defineObservableProperty('noInitialValue', undefined, promiseGenerator);
      expect(model.isSet('noInitialValue')).to.be.false; // No subscribers yet, so promise shouldn't be resolved yet.

      model.observe('noInitialValue').subscribe(function(value){
        if (value === 132) {
          expect(model.isSet('noInitialValue')).to.be.true;
          done();
        }
      });

      fulfill(132);
    });
  });

  describe('unset', function() {
    it('should unset the variable', function() {
      var model = new Model();
      model.defineObservableProperty('prop');
      var newestValue = null;
      model.observe('prop').subscribe(function(val) {
        newestValue = val;
      });

      model.set('prop', 123);
      var serialized = model.serialize();

      expect(newestValue).to.equal(123);
      expect(serialized.hasOwnProperty('prop')).to.equal(true);

      model.unset('prop');
      serialized = model.serialize();

      expect(newestValue).to.equal(undefined);
      expect(model.getCurrentValue('prop')).to.equal(undefined);
      expect(serialized.hasOwnProperty('prop')).to.equal(false);
    });
  });

  describe('setFrom', function() {
    it('should set the properties to the new values', function() {
      var model1 = new Model();
      model1.defineObservableProperty('prop');
      var model2 = new Model();
      model2.defineObservableProperty('prop');

      model1.set('prop', 123);
      model2.set('prop', 234);

      model1.setFrom(model2);

      expect(model1.getCurrentValue('prop')).to.equal(234);
    });

    it('should not set properties that didn\'t change', function() {
      var model1 = new Model();
      model1.defineObservableProperty('prop');
      model1.defineObservableProperty('prop2');
      var model2 = new Model();
      model2.defineObservableProperty('prop');
      model2.defineObservableProperty('prop2');

      model1.set('prop', 123);
      model1.set('prop2', 'abc');
      model2.set('prop', 234);
      model2.set('prop2', 'abc');

      var newValue;
      model1.observe('prop2').subscribe(function(val) {
        newValue = val;
      });
      newValue = null;

      model1.setFrom(model2);

      expect(model1.getCurrentValue('prop')).to.equal(234);
      expect(model1.getCurrentValue('prop2')).to.equal('abc');
      // Should not have emitted
      expect(newValue).to.equal(null);
    });

    it('should unset properties on this model which are not set on the argument model', function() {
      var model1 = new Model();
      model1.defineObservableProperty('prop');
      var model2 = new Model();
      model2.defineObservableProperty('prop');

      var newestValue = null;
      model1.observe('prop').subscribe(function(val) {
        newestValue = val;
      });

      model1.set('prop', 123);
      expect(newestValue).to.equal(123);

      model1.setFrom(model2);

      expect(model1.getCurrentValue('prop')).to.equal(undefined);
      expect(newestValue).not.to.equal(null);
      expect(newestValue).to.equal(undefined);
      expect(model1.isSet('prop')).to.equal(false);
    });

    it('should set only its own properties', function() {
      var model1 = new Model();
      model1.defineObservableProperty('prop');
      var model2 = new Model();
      model2.defineObservableProperty('prop');
      model2.defineObservableProperty('prop2');

      model1.set('prop', 123);
      model2.set('prop', 234);
      model2.set('prop2', 234);

      model1.setFrom(model2);

      expect(model1.getCurrentValue('prop')).to.equal(234);
      expect(function() { model1.getCurrentValue('prop2'); }).to.throw();
    });

    it('should throw on argument Models with different properties', function() {
      var model1 = new Model();
      model1.defineObservableProperty('prop');
      model1.defineObservableProperty('prop2');
      var model2 = new Model();
      model2.defineObservableProperty('prop');

      model1.set('prop', 123);
      model1.set('prop2', 234);
      model2.set('prop', 345);

      expect(function() { model1.setFrom(model2); }).to.throw();
    });
  });
});
