describe('Dataset model', function() {
  'uset strict';

  var Dataset;
  var pageForDataset = {pageId: 'abcd-1234', datasetId: 'efgh-ijkl'};
  var minimalDatasetMetadata = {
    id: 'asdf-fdsa',
    name: 'test dataset name',
    rowDisplayUnit: 'bar',
    ownerId: 'fdsa-asdf',
    updatedAt: '2004-05-20T17:42:55+00:00',
    version: 1,
    locale: 'en_US',
    columns: {},
    pages: {
      publisher: [pageForDataset],
      user: []
    }
  };

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    Dataset = $injector.get('Dataset');
  }));

  it('should correctly deserialize serialized dataset metadata passed into the constructor', function() {
    var instance = new Dataset(minimalDatasetMetadata);
    expect(instance.id).to.equal(minimalDatasetMetadata.id);
  });

  it('should reject bad/no serialized dataset metadata passed into the constructor', function() {
    expect(function(){new Dataset();}).to.throw();
    expect(function(){new Dataset(5);}).to.throw();
    expect(function(){new Dataset(null);}).to.throw();
    expect(function(){new Dataset('1234-1234');}).to.throw();
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

    expect(function() {
      var instance = new Dataset(minimalV0Blob);
    }).to.throw();
  });

  it('should eventually return a value from an arbitrarily-chosen property (rowDisplayUnit)', function(done) {
    var instance = new Dataset(minimalDatasetMetadata);
    instance.observe('rowDisplayUnit').subscribe(function(val) {
      if (val) {
        expect(val).to.equal(minimalDatasetMetadata.rowDisplayUnit);
        done();
      }
    });
  });

  it('should eventually return a page from the pages property', function(done) {
    var instance = new Dataset(minimalDatasetMetadata);
    instance.observe('pages').subscribe(function(pagesBySource) {
      if (!_.isEmpty(pagesBySource)) {
        expect(pagesBySource.publisher[0]).to.equal(pageForDataset);
        done();
      }
    });
  });

  describe('column metadata', function() {
    it('should distinguish between system and non-system columns', function(done) {
      var fakeColumns = {
        'normal_column': {
          name: 'title',
          description: 'blank!',
          fred: 'category',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column', 'search']
        },
        'normal_column_2': {
          name: 'title',
          description: 'blank!',
          fred: 'category',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column', 'search']
        },
        ':system_column': {
          name: 'title',
          description: 'blank!',
          physicalDatatype: 'number',
        },
        ':@computed_column': {
          name: 'title',
          description: 'blank!',
          fred: 'category',
          physicalDatatype: 'number',
          computationStrategy: {
            parameters: {
              region: '_mash-apes'
            },
            'source_columns': ['point_column'],
            'strategy_type': 'georegion_match_on_string'
          },
          defaultCardType: 'choropleth',
          availableCardTypes: ['choropleth']
        }
      };

      var serializedBlob = $.extend({}, minimalDatasetMetadata, { "columns": fakeColumns });
      var instance = new Dataset(serializedBlob);

      instance.observe('columns').subscribe(function(columns) {
        if (!_.isEmpty(columns)) {
          expect(columns['normal_column'].isSystemColumn).to.be.false;
          expect(columns['normal_column_2'].isSystemColumn).to.be.false;
          // Note that :@computed_column will incorrectly be labeled as
          // a system column by Dataset.js at the time of writing.
          // TODO: Let's fix that.
          //expect(columns[':@computed_column'].isSystemColumn).to.be.false;
          expect(columns[':system_column'].isSystemColumn).to.be.true;
          done();
        }
      });
    });

    it('should not throw a validation error with a column with no numbers in its name that does not include a fred', function() {
      var fakeColumns = {
        'normal_column': {
          name: 'title',
          description: 'blank!',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column', 'search']
        }
      };

      var serializedBlob = $.extend({}, minimalDatasetMetadata, { "columns": fakeColumns });
      expect(function() { var instance = new Dataset(serializedBlob); }).to.not.throw();
    });

    it('should not throw a validation error with a column with numbers in its name that does not include a fred', function() {
      var fakeColumns = {
        '2_legit_to_quit': {
          name: 'title',
          description: 'blank!',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column', 'search']
        }
      };

      var serializedBlob = $.extend({}, minimalDatasetMetadata, { "columns": fakeColumns });
      expect(function() { var instance = new Dataset(serializedBlob); }).to.not.throw();
    });

    it('should throw a validation error with a computed column that does not include a computation strategy', function() {
      var fakeColumns = {
        ':@computed_column': {
          name: 'title',
          description: 'blank!',
          fred: 'category',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column', 'search']
        }
      };

      var serializedBlob = $.extend({}, minimalDatasetMetadata, { "columns": fakeColumns });
      expect(function() { var instance = new Dataset(serializedBlob); }).to.throw();
    });

    it('should include an injected reference back to the Dataset instance.', function(done) {
      var fakeColumns = {
        'normal_column': {
          name: 'title',
          description: 'blank!',
          fred: 'category',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column', 'search']
        }
      };

      var serializedBlob = $.extend({}, minimalDatasetMetadata, { "columns": fakeColumns });
      var instance = new Dataset(serializedBlob);

      instance.observe('columns').subscribe(function(columns) {
        if (!_.isEmpty(columns)) {
          expect(columns['normal_column'].dataset).to.equal(instance);
          done();
        }
      });
    });
  });
});
