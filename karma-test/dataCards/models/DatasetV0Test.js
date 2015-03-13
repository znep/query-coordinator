describe('DatasetV0 model', function() {
  var MockDataService = {};
  var mockCardDataService = {};
  var _DatasetV0;
  var _Page;

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
      $provide.value('CardDataService', mockCardDataService);
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

  it('should eventually return a value from an arbitrarily-chosen property (rowDisplayUnit)', function(done) {
    var testId = 'dead-beef';
    var fakeDisplayUnit = 'test';

    var datasetMetadataDefer = _$q.defer();
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
      return _$q.when(minimalBlob);
    };

    var def = _$q.defer();
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

  describe('isReadableByCurrentUser', function() {
    var def;
    var instance;
    var subscription;

    beforeEach(function() {
      def = _$q.defer();
      mockCardDataService.getRowCount = _.constant(def.promise);
      instance = new _DatasetV0('dead-beef');
      // subscribe to the rowCount so that it will make a request for the dataset count
      subscription = instance.observe('rowCount').subscribe(_.noop);
    });

    afterEach(function() {
      subscription.dispose();
      subscription = null;
    });

    // For some reason, calling .reject does not invoke the rowCountPromise.catch callback.
    // We attempted to - instead of using mocks - use httpBackend and return a 403 response, but
    // mocha dies with a mysterious 'undefined' error whose stack is almost completely within the
    // mocha library.
    xit('sets isReadableByCurrentUser to false if it gets a 403 from the server', function(done) {
      expect(instance.getCurrentValue('isReadableByCurrentUser')).to.equal(true);
      def.reject({ status: 403 });
      expect(instance.getCurrentValue('isReadableByCurrentUser')).to.equal(false);
    });

    it('does not modify isReadableByCurrentUser if it gets a 200 from the server', function() {
      expect(instance.getCurrentValue('isReadableByCurrentUser')).to.equal(true);
      def.resolve({ status: 200 });
      expect(instance.getCurrentValue('isReadableByCurrentUser')).to.equal(true);
    });
  });

  describe('column metadata', function() {
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

      var def = _$q.defer();
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

    it('should include an injected reference back to the Dataset instance.', function(done) {
      var fakeColumns = [
        {
          title: 'title',
          name: 'normal_column',
          logicalDatatype: 'category',
          physicalDatatype: 'number',
          importance: 1
        }
      ];
      var serializedBlob = $.extend({}, minimalBlob, { "columns": fakeColumns });

      var def = _$q.defer();
      MockDataService.getDatasetMetadata = function() {
        return def.promise;
      };

      var instance = new _DatasetV0('fake-data');
      instance.observe('columns').subscribe(function(columns) {
        if (!_.isEmpty(columns)) {
          expect(columns['normal_column'].dataset).to.equal(instance);
          done();
        }
      });

      def.resolve(serializedBlob);
      _$rootScope.$digest();

    });

  });

});
