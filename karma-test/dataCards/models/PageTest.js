describe("Page model", function() {
  var _Page, _$q;

  var MockPageProvider = {};

  beforeEach(function() {
    module('dataCards', function($provide) {
      MockPageProvider = {};
      $provide.value('PageProvider', MockPageProvider);
    })
  });

  beforeEach(inject(function(Page, $q, $rootScope) {
    _Page = Page;
    _$q = $q;
    _$rootScope = $rootScope;
  }));

  it('should correctly report the id passed into the constructor.', inject(function(Page) {
    var id = 'dead-beef';
    var instance = new Page(id);
    expect(instance.id).to.equal(id);
  }));

  it('should not attempt to fetch data if it is set locally first', function() {
    var id = 'dead-beef';
    var desc1 = 'A fine description';
    var desc2 = 'Another fine description';
    var desc3 = 'Yet another fine description';
    var expectedSequence = [desc1, desc2, desc3];

    MockPageProvider.getDescription = function(id) {
      throw new Error("Should never try to get description");
    };

    var instance = new _Page(id);
    instance.description = desc1;
    instance.description.subscribe(function(val) {
      expect(val).to.equal(expectedSequence.shift());
    });
    instance.description = desc2;
    instance.description = desc3;
    expect(expectedSequence).to.be.empty;
  });

  it('should attempt to fetch the description only when it is accessed.', function() {
    var id = 'dead-beef';
    var descFromApi = 'fromApi';
    var descFromSetter1 = 'fromSetter1';
    var descFromSetter2 = 'fromSetter2';
    var expectedSequence = [undefined, descFromApi, descFromSetter1, descFromSetter2];

    var shouldBeResolved = false;

    var description =_$q.defer();
    var getDescCalled = false;
    MockPageProvider.getDescription = function(id) {
      expect(getDescCalled).to.be.false;
      getDescCalled = true;
      expect(id).to.equal(id);
      return description.promise;
    };

    var instance = new _Page(id);
    instance.description.subscribe(function(val) {
      var exp = expectedSequence.shift();
      expect(shouldBeResolved).to.equal(exp !== undefined); // If it's undefined, it shouldn't be resolved
      expect(val).to.equal(exp);
    });

    shouldBeResolved = true;
    description.resolve(descFromApi);
    _$rootScope.$digest();
    expect(getDescCalled).to.be.true;

    instance.description = descFromSetter1;
    instance.description = descFromSetter2;
    expect(expectedSequence).to.be.empty;
  });
});
