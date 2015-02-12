describe('DatasetV0 model', function() {
  var MockDataService = {};
  var _DatasetV0, _Page;

  // Minimal DatasetV0 blob which will validate.
  var minimalBlob = {
    id: 'asdf-fdsa',
    name: 'test dataset name',
    defaultAggregateColumn: 'foo',
    rowDisplayUnit: 'bar',
    ownerId: 'fdsa-asdf',
    updatedAt: '2004-05-20T17:42:55+00:00',
    columns: []
  };

  beforeEach(function() {
    module('dataCards', function($provide) {
      MockDataService = {};
      $provide.value('DatasetDataService', MockDataService);
    })
  });

  beforeEach(inject(function(Page, DatasetV0, $q, $rootScope) {
    _Page = Page;
    _DatasetV0 = DatasetV0;
    _$q = $q;
    _$rootScope = $rootScope;
  }));

  it('should correctly report the id passed into the constructor.', inject(function(DatasetV0) {
    var id = 'dead-beef';
    var instance = new DatasetV0(id);
    expect(instance.id).to.equal(id);
  }));

  it('should reject bad/no 4x4s passed into the constructor.', inject(function(DatasetV0) {
    expect(function(){new DatasetV0();}).to.throw();
    expect(function(){new DatasetV0(5);}).to.throw();
    expect(function(){new DatasetV0(null);}).to.throw();
    expect(function(){new DatasetV0('1234-12345');}).to.throw();
    expect(function(){new DatasetV0('12345-1234');}).to.throw();
    expect(function(){new DatasetV0('foo.-beef');}).to.throw();
  }));

  it('should eventually return a value from the rowDisplayUnit property', function(done) {
    var testId = 'dead-beef';
    var fakeDisplayUnit = 'test';

    var datasetMetadataDefer =_$q.defer();
    MockDataService.getDatasetMetadata = function(schemaVersion, id) {
      expect(id).to.equal(testId);
      return datasetMetadataDefer.promise;
    };

    var instance = new _DatasetV0(testId);
    instance.observe('rowDisplayUnit').subscribe(function(val) {
      if (val) {
        expect(val).to.equal(fakeDisplayUnit);
        done();
      }
    });

    datasetMetadataDefer.resolve($.extend({}, minimalBlob, { "rowDisplayUnit": fakeDisplayUnit}));
    _$rootScope.$digest();
  });

  it('should eventually return a bunch of Pages from the pages property', function(done) {
    var testId = 'dead-beef';
    var fakePageIds = {
        'user': _.times(4, function(idx) {
          return {pageId: _.uniqueId('fakeUserPageId')};
        }),
        'publisher': _.times(3, function(idx) {
          return {pageId: _.uniqueId('fakePublisherPageId')};
        })
      };

    MockDataService.getDatasetMetadata = function(schemaVersion, id) {
      return $q.when(minimalBlob);
    };

    var def =_$q.defer();
    MockDataService.getPagesForDataset = function(schemaVersion, id) {
      expect(id).to.equal(testId);
      return def.promise;
    };

    var instance = new _DatasetV0(testId);
    instance.observe('pages').subscribe(function(pagesBySource) {
      if (!_.isEmpty(pagesBySource)) {
        _.each(pagesBySource, function(pages, source) {
          _.each(pages, function(page, idx) {
            expect(page).to.be.instanceof(_Page);
            expect(page.id).to.equal(fakePageIds[source][idx].pageId);
          });
        });
        done();
      }
    });

    def.resolve(fakePageIds);
    _$rootScope.$digest();
  });

  it('should distinguish between system and non-system columns', function(done) {
    var fakeColumns = [
      {
        title: 'title',
        name: 'normal_column',
        logicalDatatype: 'category',
        physicalDatatype: 'number',
        importance: 1
      },
      {
        title: 'title',
        name: ':system_column',
        logicalDatatype: 'category',
        physicalDatatype: 'number',
        importance: 1
      },
      {
        title: 'title',
        name: 'still_a_:normal_column:',
        logicalDatatype: 'category',
        physicalDatatype: 'number',
        importance: 1
      }
    ];
    var serializedBlob = $.extend({}, minimalBlob, { "columns": fakeColumns });

    var def =_$q.defer();
    MockDataService.getDatasetMetadata = function() {
      return def.promise;
    };

    var instance = new _DatasetV0('fake-data');
    instance.observe('columns').subscribe(function(columns) {
      if (!_.isEmpty(columns)) {
        expect(columns['normal_column'].isSystemColumn).to.be.false;
        expect(columns[':system_column'].isSystemColumn).to.be.true;
        expect(columns['still_a_:normal_column:'].isSystemColumn).to.be.false;
        done();
      }
    });

    def.resolve(serializedBlob);
    _$rootScope.$digest();
  });
});
