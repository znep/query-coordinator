describe("Dataset model", function() {
  var MockDataService = {};
  var _Dataset, _Page;

  beforeEach(function() {
    module('dataCards', function($provide) {
      MockDataService = {};
      $provide.value('DatasetDataService', MockDataService);
    })
  });

  beforeEach(inject(function(Page, Dataset, $q, $rootScope) {
    _Page = Page;
    _Dataset = Dataset;
    _$q = $q;
    _$rootScope = $rootScope;
  }));

  it('should correctly report the id passed into the constructor.', inject(function(Dataset) {
    var id = 'dead-beef';
    var instance = new Dataset(id);
    expect(instance.id).to.equal(id);
  }));
  it('should reject bad/no 4x4s passed into the constructor.', inject(function(Dataset) {
    expect(function(){new Dataset();}).to.throw();
    expect(function(){new Dataset(5);}).to.throw();
    expect(function(){new Dataset(null);}).to.throw();
    expect(function(){new Dataset('1234-12345');}).to.throw();
    expect(function(){new Dataset('12345-1234');}).to.throw();
    expect(function(){new Dataset('foo.-beef');}).to.throw();
  }));

  it('should eventually return a value from the rowCount property', function(done) {
    var id = 'dead-beef';
    var fakeRowCount = 5;

    var staticInfoDefer =_$q.defer();
    MockDataService.getStaticInfo = function(id) {
      expect(id).to.equal(id);
      return staticInfoDefer.promise;
    };

    var instance = new _Dataset(id);
    instance.rowCount.subscribe(function(val) {
      if (val) {
        expect(val).to.equal(fakeRowCount);
        done();
      }
    });

    staticInfoDefer.resolve({ "rowCount": fakeRowCount});
    _$rootScope.$digest();
  });
});
