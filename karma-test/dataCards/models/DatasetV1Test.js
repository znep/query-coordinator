describe('DatasetV1 model', function() {
  var MockDataService = {};
  var DatasetV1, Page;

  // Minimal DatasetV1 blob which will validate.
  var minimalV1Blob = {
    id: 'asdf-fdsa',
    name: 'test dataset name',
    rowDisplayUnit: 'bar',
    ownerId: 'fdsa-asdf',
    updatedAt: '2004-05-20T17:42:55+00:00',
    version: '1',
    locale: 'en_US',
    columns: {}
  };

  beforeEach(function() {
    module('dataCards', function($provide) {
      MockDataService = {};
      $provide.value('DatasetDataService', MockDataService);
    })
  });

  beforeEach(inject(function($injector) {
    Page = $injector.get('Page');
    DatasetV1 = $injector.get('DatasetV1');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
  }));

  it('should correctly report the id passed into the constructor.', function() {
    var id = 'dead-beef';
    var instance = new DatasetV1(id);
    expect(instance.id).to.equal(id);
  });

  it('should reject bad/no 4x4s passed into the constructor.', function() {
    expect(function(){new DatasetV1();}).to.throw();
    expect(function(){new DatasetV1(5);}).to.throw();
    expect(function(){new DatasetV1(null);}).to.throw();
    expect(function(){new DatasetV1('1234-12345');}).to.throw();
    expect(function(){new DatasetV1('12345-1234');}).to.throw();
    expect(function(){new DatasetV1('foo.-beef');}).to.throw();
  });

  it('should reject V0 metadata', function() {
    // Minimal DatasetV0 blob which will validate.
    var minimalV0Blob = {
      id: 'asdf-fdsa',
      name: 'test dataset name',
      defaultAggregateColumn: 'foo',
      rowDisplayUnit: 'bar',
      ownerId: 'fdsa-asdf',
      updatedAt: '2004-05-20T17:42:55+00:00',
      columns: []
    };

    var testId = 'dead-beef';

    var datasetMetadataDefer = $q.defer();
    MockDataService.getDatasetMetadata = function(schemaVersion, id) {
      return datasetMetadataDefer.promise;
    };

    var instance = new DatasetV1(testId);
    expect(function() {
      // Fetch an arbitrary property to make the model fetch its data.
      instance.observe('rowDisplayUnit').subscribe(_.noop);

      // Resolve the promise.
      datasetMetadataDefer.resolve(minimalV0Blob);
      // Make $q actually resolve.
      $rootScope.$digest();

    }).to.throw();
  });

  it('should eventually return a value from an arbitrarily-chosen property (rowDisplayUnit)', function(done) {
    var testId = 'dead-beef';
    var fakeDisplayUnit = 'test';

    var datasetMetadataDefer = $q.defer();
    MockDataService.getDatasetMetadata = function(schemaVersion, id) {
      expect(id).to.equal(testId);
      return datasetMetadataDefer.promise;
    };

    var instance = new DatasetV1(testId);
    instance.observe('rowDisplayUnit').subscribe(function(val) {
      if (val) {
        expect(val).to.equal(fakeDisplayUnit);
        done();
      }
    });

    datasetMetadataDefer.resolve($.extend({}, minimalV1Blob, { "rowDisplayUnit": fakeDisplayUnit}));
    $rootScope.$digest();
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

    var def =$q.defer();
    MockDataService.getPagesForDataset = function(schemaVersion, id) {
      expect(id).to.equal(testId);
      return def.promise;
    };

    var instance = new DatasetV1(testId);
    instance.observe('pages').subscribe(function(pagesBySource) {
      if (!_.isEmpty(pagesBySource)) {
        _.each(pagesBySource, function(pages, source) {
          _.each(pages, function(page, idx) {
            expect(page).to.be.instanceof(Page);
            expect(page.id).to.equal(fakePageIds[source][idx].pageId);
          });
        });
        done();
      }
    });

    def.resolve(fakePageIds);
    $rootScope.$digest();
  });

  it('should distinguish between system and non-system columns', function(done) {
    var fakeColumns = {
      'normal_column': {
        name: 'title',
        description: 'blank!',
        fred: 'category',
        physicalDatatype: 'number',
      },
      ':system_column': {
        name: 'title',
        description: 'blank!',
        fred: 'category',
        physicalDatatype: 'number',
      },
      'still_a_:normal_column:': {
        name: 'title',
        description: 'blank!',
        fred: 'category',
        physicalDatatype: 'number',
      }
    };

    var serializedBlob = $.extend({}, minimalV1Blob, { "columns": fakeColumns });

    var def = $q.defer();
    MockDataService.getDatasetMetadata = function() {
      return def.promise;
    };

    var instance = new DatasetV1('fake-data');
    instance.observe('columns').subscribe(function(columns) {
      if (!_.isEmpty(columns)) {
        expect(columns['normal_column'].isSystemColumn).to.be.false;
        expect(columns[':system_column'].isSystemColumn).to.be.true;
        expect(columns['still_a_:normal_column:'].isSystemColumn).to.be.false;
        done();
      }
    });

    def.resolve(serializedBlob);
    $rootScope.$digest();
  });
});
