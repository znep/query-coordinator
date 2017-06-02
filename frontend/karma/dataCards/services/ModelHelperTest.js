import { expect, assert } from 'chai';
const angular = require('angular');

describe('ModelHelper', function() {
  'use strict';

  var _mh, _$q, _$rootScope;

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(inject(function(ModelHelper, $q, $rootScope) {
    _mh = ModelHelper;
    _$q = $q;
    _$rootScope = $rootScope;
  }));

  it('should support simple RW properties', function(done) {
    var expectedValues = ['default', 'notDefault'];
    var instance = {};

    _mh.addProperty('prop', instance, 'default');
    expect(instance).to.have.property('prop');

    instance.prop.subscribe(function(val) {
      expect(val).to.equal(expectedValues.shift());
      if (expectedValues.length == 0) {
        done();
      }
    });

    instance.prop = 'notDefault';
  });

  it('(RW) should not attempt to get lazy default if value is set first.', function() {
    var desc1 = 'A fine description';
    var desc2 = 'Another fine description';
    var desc3 = 'Yet another fine description';
    var title1 = 'First title';
    var title2 = 'Second title';
    var expectedSequenceDesc = [desc1, desc2, desc3];
    var expectedSequenceTitle = [title1, title2];

    function promiser() {
      throw new Error("Should never request lazy default");
    };

    var instance = {};
    _mh.addPropertyWithLazyDefault('title', instance, undefined, promiser);
    _mh.addPropertyWithLazyDefault('description', instance, undefined, promiser);

    instance.title = title1;
    instance.title.subscribe(function(val) {
      expect(val).to.equal(expectedSequenceTitle.shift());
    });

    instance.description = desc1;
    instance.description.subscribe(function(val) {
      expect(val).to.equal(expectedSequenceDesc.shift());
    });
    instance.description = desc2;
    instance.description = desc3;

    instance.title = title2;

    assert.lengthOf(expectedSequenceDesc, 0);
    assert.lengthOf(expectedSequenceTitle, 0);
  });

  it('(RW) should attempt to get lazy default if strictly needed.', function(done) {
    var descFromDefault = 'fromDefault';
    var descFromSetter1 = 'fromSetter1';
    var descFromSetter2 = 'fromSetter2';
    var expectedSequence = [undefined, descFromDefault, descFromSetter1, descFromSetter2];

    var shouldBeResolved = false;

    var description =_$q.defer();
    var getDescCalled = false;
    function promiser() {
      assert.isFalse(getDescCalled);
      getDescCalled = true;
      return description.promise;
    };

    var instance = {};
    _mh.addPropertyWithLazyDefault('description', instance, undefined, promiser);

    instance.description.subscribe(function(val) {
      assert.isTrue(expectedSequence.length >= 1);
      var exp = expectedSequence.shift();
      expect(shouldBeResolved).to.equal(exp !== undefined); // If it's undefined, it shouldn't be resolved
      expect(val).to.equal(exp);
      if (_.isEmpty(expectedSequence)) {
        done();
      }
    });

    shouldBeResolved = true;
    description.resolve(descFromDefault);
    _$rootScope.$digest();
    assert.isTrue(getDescCalled);

    instance.description = descFromSetter1;
    instance.description = descFromSetter2;
    assert.lengthOf(expectedSequence, 0);
  });

  it('(RW) should always prefer the setter value over an in-flight request', function() {
    var descFromDefault = 'fromDefault';
    var descFromSetter1 = 'fromSetter1';
    var descFromSetter2 = 'fromSetter2';
    var expectedSequence = [undefined, descFromSetter1, descFromSetter2];

    var shouldBeResolved = false;

    var description =_$q.defer();
    var getDescCalled = false;
    function promiser() {
      assert.isFalse(getDescCalled);
      getDescCalled = true;
      return description.promise;
    };

    var instance = {};
    _mh.addPropertyWithLazyDefault('description', instance, undefined, promiser);

    // Start the sequence.
    instance.description.subscribe(function(val) {
      assert.isTrue(expectedSequence.length >= 1);
      var exp = expectedSequence.shift();
      expect(val).to.equal(exp);
    });
    assert.isTrue(getDescCalled);

    // Call the setter before the promise succeeds.
    instance.description = descFromSetter1;

    // Finally resolve the promise.
    description.resolve(descFromDefault);
    _$rootScope.$digest();

    // Set one more time.
    instance.description = descFromSetter2;

    assert.lengthOf(expectedSequence, 0);
  });

  //TODO handle error cases.
});
