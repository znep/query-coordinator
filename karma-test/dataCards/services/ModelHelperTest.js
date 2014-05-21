describe("Page model", function() {
  var _mh, _$q, _$rootScope;

  beforeEach(module('dataCards.services'));
  beforeEach(inject(function(ModelHelper, $q, $rootScope) {
    _mh = ModelHelper;
    _$q = $q;
    _$rootScope = $rootScope;
  }));

  it('should not attempt to get lazy default if value is set first.', function() {
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
    _mh.addPropertyWithLazyDefault('title', instance, promiser);
    _mh.addPropertyWithLazyDefault('description', instance, promiser);
    
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

    expect(expectedSequenceDesc).to.be.empty;
    expect(expectedSequenceTitle).to.be.empty;
  });

  it('should attempt to get lazy default if strictly needed.', function(done) {
    var descFromDefault = 'fromDefault';
    var descFromSetter1 = 'fromSetter1';
    var descFromSetter2 = 'fromSetter2';
    var expectedSequence = [undefined, descFromDefault, descFromSetter1, descFromSetter2];

    var shouldBeResolved = false;

    var description =_$q.defer();
    var getDescCalled = false;
    function promiser() {
      expect(getDescCalled).to.be.false;
      getDescCalled = true;
      return description.promise;
    };

    var instance = {};
    _mh.addPropertyWithLazyDefault('description', instance, promiser);

    instance.description.subscribe(function(val) {
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
    expect(getDescCalled).to.be.true;

    instance.description = descFromSetter1;
    instance.description = descFromSetter2;
    expect(expectedSequence).to.be.empty;
  });

  it('should always prefer the setter value over an in-flight request', function() {
    var descFromDefault = 'fromDefault';
    var descFromSetter1 = 'fromSetter1';
    var descFromSetter2 = 'fromSetter2';
    var expectedSequence = [undefined, descFromSetter1, descFromSetter2];

    var shouldBeResolved = false;

    var description =_$q.defer();
    var getDescCalled = false;
    function promiser() {
      expect(getDescCalled).to.be.false;
      getDescCalled = true;
      return description.promise;
    };

    var instance = {};
    _mh.addPropertyWithLazyDefault('description', instance, promiser);

    // Start the sequence.
    instance.description.subscribe(function(val) {
      expect(expectedSequence).to.not.be.empty;
      var exp = expectedSequence.shift();
      expect(val).to.equal(exp);
    });
    expect(getDescCalled).to.be.true;

    // Call the setter before the promise succeeds.
    instance.description = descFromSetter1;

    // Finally resolve the promise.
    description.resolve(descFromDefault);
    _$rootScope.$digest();

    // Set one more time.
    instance.description = descFromSetter2;

    expect(expectedSequence).to.be.empty;
  });

  //TODO handle error cases.
});
