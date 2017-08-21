import { expect, assert } from 'chai';
const angular = require('angular');

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
    columns: {}
  };
  var minimalMigrationMetadata = {
    nbeId: 'four-four',
    obeId: 'asdf-fdsa'
  };

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    Dataset = $injector.get('Dataset');
  }));

  it('should correctly deserialize serialized dataset metadata passed into the constructor', function() {
    var instance = new Dataset(minimalDatasetMetadata, minimalMigrationMetadata);
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
      var instance = new Dataset(minimalV0Blob, minimalMigrationMetadata);
    }).to.throw();
  });

  it('should eventually return a value from an arbitrarily-chosen property (rowDisplayUnit)', function(done) {
    var instance = new Dataset(minimalDatasetMetadata, minimalMigrationMetadata);
    instance.observe('rowDisplayUnit').subscribe(function(val) {
      if (val) {
        expect(val).to.equal(minimalDatasetMetadata.rowDisplayUnit);
        done();
      }
    });
  });

  it('should have an undefined obeId property if migrationMetadata is not available', function() {
    var instance = new Dataset(minimalDatasetMetadata);
    assert.isUndefined(instance.obeId);
  });

  describe('column metadata', function() {
    it('should distinguish between system and non-system columns', function(done) {
      var fakeColumns = {
        'normal_column': {
          name: 'title',
          description: 'blank!',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column', 'search']
        },
        'normal_column_2': {
          name: 'title',
          description: 'blank!',
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
      var instance = new Dataset(serializedBlob, minimalMigrationMetadata);

      instance.observe('columns').subscribe(function(columns) {
        if (!_.isEmpty(columns)) {
          assert.isFalse(columns['normal_column'].isSystemColumn);
          assert.isFalse(columns['normal_column_2'].isSystemColumn);
          // Note that :@computed_column will incorrectly be labeled as
          // a system column by Dataset.js at the time of writing.
          // TODO: Let's fix that.
          //assert.isFalse(columns[':@computed_column'].isSystemColumn);
          assert.isTrue(columns[':system_column'].isSystemColumn);
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
      expect(function() { var instance = new Dataset(serializedBlob, minimalMigrationMetadata); }).to.not.throw();
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
      expect(function() { var instance = new Dataset(serializedBlob, minimalMigrationMetadata); }).to.not.throw();
    });

    it('should throw a validation error with a computed column that does not include a computation strategy', function() {
      var fakeColumns = {
        ':@computed_column': {
          name: 'title',
          description: 'blank!',
          physicalDatatype: 'number',
          defaultCardType: 'column',
          availableCardTypes: ['column', 'search']
        }
      };

      var serializedBlob = $.extend({}, minimalDatasetMetadata, { "columns": fakeColumns });
      expect(function() { var instance = new Dataset(serializedBlob, minimalMigrationMetadata); }).to.throw();
    });

    it('should include an injected reference back to the Dataset instance.', function(done) {
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
      var instance = new Dataset(serializedBlob, minimalMigrationMetadata);

      instance.observe('columns').subscribe(function(columns) {
        if (!_.isEmpty(columns)) {
          expect(columns['normal_column'].dataset).to.equal(instance);
          done();
        }
      });
    });
  });
});
