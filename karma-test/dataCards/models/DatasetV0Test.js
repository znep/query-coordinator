describe('DatasetV0 model', function() {
  var MockDataService = {};
  var mockCardDataService = {};
  var DatasetV0;
  var Mockumentary;
  var $rootScope;

  var pageForDataset = {pageId: 'abcd-1234', datasetId: 'efgh-ijkl'};
  // Minimal DatasetV0 blob which will validate.
  var minimalBlob = {
    id: 'asdf-fdsa',
    name: 'test dataset name',
    defaultAggregateColumn: 'foo',
    rowDisplayUnit: 'bar',
    ownerId: 'fdsa-asdf',
    updatedAt: '2004-05-20T17:42:55+00:00',
    columns: [],
    pages: {
      publisher: [pageForDataset],
      user: []
    },
    version: 0
  };

  beforeEach(function() {
    module('dataCards', function($provide) {
      $provide.value('CardDataService', mockCardDataService);
    })
  });

  beforeEach(inject(function($injector) {
    Page = $injector.get('Page');
    Mockumentary = $injector.get('Mockumentary');
    DatasetV0 = $injector.get('DatasetV0');
    $rootScope = $injector.get('$rootScope');
  }));

  it('should correctly report the id passed into the constructor.', inject(function(DatasetV0) {
    var instance = new DatasetV0(minimalBlob);
    expect(instance.id).to.equal(minimalBlob.id);
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
    var instance = new DatasetV0(minimalBlob);
    instance.observe('rowDisplayUnit').subscribe(function(val) {
      if (val) {
        expect(val).to.equal(minimalBlob.rowDisplayUnit);
        done();
      }
    });
  });

  it('should eventually return a page from the pages property', function(done) {
    var instance = new DatasetV0(minimalBlob);
    instance.observe('pages').subscribe(function(pagesBySource) {
      if (!_.isEmpty(pagesBySource)) {
        expect(pagesBySource.publisher[0]).to.equal(pageForDataset);
        done();
      }
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
      var instance = new DatasetV0(serializedBlob);

      instance.observe('columns').subscribe(function(columns) {
        if (!_.isEmpty(columns)) {
          expect(columns['normal_column'].isSystemColumn).to.be.false;
          expect(columns[':system_column'].isSystemColumn).to.be.true;
          expect(columns['still_a_:normal_column:'].isSystemColumn).to.be.false;
          done();
        }
      });
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

      var serializedBlob = $.extend(true, minimalBlob, { "columns": fakeColumns });
      var instance = new DatasetV0(serializedBlob);

      instance.observe('columns').subscribe(function(columns) {
        if (!_.isEmpty(columns)) {
          expect(columns['normal_column'].dataset).to.equal(instance);
          done();
        }
      });
    });

  });

});
