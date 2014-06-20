describe("Page model", function() {
  var _Page, _Dataset, _$q;

  var MockPageDataService = {};

  beforeEach(function() {
    module('dataCards', function($provide) {
      MockPageDataService = {};
      $provide.value('PageDataService', MockPageDataService);
    })
  });

  beforeEach(inject(function(Page, Dataset, $q, $rootScope) {
    _Page = Page;
    _Dataset = Dataset;
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

    MockPageDataService.getBaseInfo = function(id) {
      throw new Error("Should never try to get base info.");
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

    var staticInfoDefer =_$q.defer();
    var getBaseInfoCalled = false;
    MockPageDataService.getBaseInfo = function(id) {
      expect(getBaseInfoCalled).to.be.false;
      getBaseInfoCalled = true;
      expect(id).to.equal(id);
      return staticInfoDefer.promise;
    };

    var instance = new _Page(id);
    instance.description.subscribe(function(val) {
      var exp = expectedSequence.shift();
      expect(shouldBeResolved).to.equal(exp !== undefined); // If it's undefined, it shouldn't be resolved
      expect(val).to.equal(exp);
    });

    shouldBeResolved = true;
    staticInfoDefer.resolve({ "description": descFromApi});
    _$rootScope.$digest();
    expect(getBaseInfoCalled).to.be.true;

    instance.description = descFromSetter1;
    instance.description = descFromSetter2;
    expect(expectedSequence).to.be.empty;
  });

  it('should eventually return a Dataset model from the dataset property', function(done) {
    var id = 'dead-beef';
    var datasetId = 'fooo-baar';

    var staticInfoDefer =_$q.defer();
    MockPageDataService.getBaseInfo = function(id) {
      expect(id).to.equal(id);
      return staticInfoDefer.promise;
    };

    var instance = new _Page(id);
    instance.dataset.subscribe(function(val) {
      if (val instanceof _Dataset) {
        expect(val.id).to.equal(datasetId);
        done();
      }
    });

    staticInfoDefer.resolve({ "datasetId": datasetId});
    _$rootScope.$digest();
  });
});
