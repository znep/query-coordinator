import d3 from 'd3';
import _ from 'lodash';
import testData from '../testData';
import MetadataProvider from 'common/visualizations/dataProviders/MetadataProvider';

describe('MetadataProvider', () => {
  const VALID_DOMAIN = 'example.com';
  const VALID_DATASET_UID = 'test-test';

  const INVALID_DOMAIN = null;
  const INVALID_DATASET_UID = null;

  const ERROR_STATUS = 400;
  const ERROR_MESSAGE = 'Bad request';

  const SUCCESS_STATUS = 200;

  const SAMPLE_DATASET_METADATA_REQUEST_ERROR = '';

  const SAMPLE_DATASET_METADATA_REQUEST_RESPONSE = JSON.stringify({
    "name": "Case Data from San Francisco 311",
    "updatedAt": "2014-08-22T22:36:10.000Z",
    "defaultPage": "cs5s-apnb",
    "description": "Cases created since 7/1/2008 with location information",
    "domain": "dataspace.demo.socrata.com",
    "rowDisplayUnit": "Case",
    "locale": "en_US",
    "id": "r6t9-rak2",
    "columns": {
      "request_details": {
        "name": "request details",
        "fred": "text",
        "description": "Cases created since 7/1/2008 with location information",
        "physicalDatatype": "text",
        "position": 9,
        "hideInTable": false,
        "format": {},
        "dataTypeName": "text",
        "renderTypeName": "text"
      },
      "category": {
        "name": "category",
        "fred": "category",
        "description": "",
        "physicalDatatype": "text",
        "position": 7,
        "hideInTable": false,
        "format": {},
        "dataTypeName": "text",
        "renderTypeName": "text"
      }
    },
    "ownerId": "8ibz-n25n",
    "permissions": {
      "isPublic": true,
      "rights": [
        "read"
      ]
    }
  });

  const SAMPLE_ROW_REQUEST_RESPONSE = JSON.stringify([
    {
      "address": "Intersection of TREASURE ISLAND RD and",
      "case_id": "501753",
      "category": "General Requests",
      "closed": "2009-12-30T09:13:10.000",
      "neighborhood": "Treasure Island/YBI",
      "opened": "2009-09-09T06:50:28.000",
      "point": {
        "type": "Point",
        "coordinates": [-122.36357929,37.808938925]
      },
      "request_details": "tida - tida - request_for_service",
      "request_type": "tida - tida - request_for_service",
      "responsible_agency": "PUC - Electric/Power - G - Hold",
      "source": "Voice In",
      "status": "Closed",
      "supervisor_district": "6",
      "updated": "2009-12-30T09:13:10.000"
    },
  ]);

  const SAMPLE_DATASET_METADATA = testData.CHICAGO_CRIMES_DATASET_METADATA;

  const SAMPLE_METADATA_ERROR = JSON.stringify({
    "code" : "not_found",
    "error" : true,
    "message" : "Cannot find view with id 56p4-vdcc.jso"
  });

  const SAMPLE_MIGRATION_METADATA = {
    "migrationPhase": "prep",
    "migrationPhaseUpdated": 1462987365,
    "nbeId": "h6bt-4qvq",
    "nbePublicationGroup": 95,
    "obeId": "yrcj-6b25",
    "syncedAt": 1462987365
  };

  let server;
  const metadataProviderOptions = {
    domain: VALID_DOMAIN,
    datasetUid: VALID_DATASET_UID
  };
  let metadataProvider;

  beforeEach(() => {
    server = sinon.fakeServer.create();
    metadataProvider = new MetadataProvider(metadataProviderOptions);
  });

  afterEach(() => {
    server.restore();
  });

  describe('constructor', () => {
    it('should throw with invalid configuration values', () => {
      assert.throw(() => {
        const metadataProvider = new MetadataProvider({
          domain: INVALID_DOMAIN,
          datasetUid: VALID_DATASET_UID
        });
      });

      assert.throw(() => {
        const metadataProvider = new MetadataProvider({
          domain: VALID_DOMAIN,
          datasetUid: INVALID_DATASET_UID
        });
      });
    });
  });

  describe('`.getShapefileMetadata`', () => {
    it('should use the results from the curated regions API', (done) => {
      server.respondWith(/\/api\/curated_regions/, JSON.stringify({
        geometryLabel: null,
        featurePk: 'cnidaria'
      }));

      metadataProvider.
        getShapefileMetadata().
        then(
          (data) => {
            assert.equal(data.geometryLabel, null);
            assert.equal(data.featurePk, 'cnidaria');
            done();
          },
          (error) => {

            // Fail the test since we expected a success response.
            assert.isTrue(undefined);
            done();
          }
        ).catch(
          (e) => {

            // Fail the test since we shouldn't be encountering an
            // exception in any case.
            console.log(e.message);
            assert.isFalse(e);
            done();
          }
        );

      server.respond();
    });

    it('should return default values for both metadata keys if curated region request fails', (done) => {
      server.respondWith(/\/api\/curated_regions/, [ERROR_STATUS, {}, '']);

      metadataProvider.
        getShapefileMetadata().
        then(
          (data) => {
            assert.equal(data.geometryLabel, null);
            assert.equal(data.featurePk, '_feature_id');
            done();
          },
          (error) => {

            // Fail the test since we expected a success response.
            assert.isTrue(undefined);
            done();
          }
        ).catch(
          (e) => {

            // Fail the test since we shouldn't be encountering an
            // exception in any case.
            console.log(e.message);
            assert.isFalse(e);
            done();
          }
        );

      server.respond();
    });
  });

  describe('getDatasetMetadata()', () => {
    it('should query the NBE by default', () => {
      metadataProvider.getDatasetMetadata(); // Discard the response, we don't care.
      assert.lengthOf(server.requests, 1);
      assert.include(
        server.requests[0].url,
        '/api/views/test-test.json'
      );
    });

    describe('cross-domain request', () => {
      it('should not provide the X-Socrata-Federation header', () => {
        metadataProvider.getDatasetMetadata(); // Discard the response, we don't care.
        assert.lengthOf(server.requests, 1);
        assert.notProperty(
          server.requests[0].requestHeaders,
          'X-Socrata-Federation'
        );
      });
    });

    describe('same-domain request', () => {
      it('should provide the X-Socrata-Federation header', () => {
        const metadataProviderOptions = {
          domain: window.location.hostname,
          datasetUid: VALID_DATASET_UID
        };
        metadataProvider = new MetadataProvider(metadataProviderOptions);
        metadataProvider.getDatasetMetadata(); // Discard the response, we don't care.
        assert.lengthOf(server.requests, 1);
        assert.propertyVal(
          server.requests[0].requestHeaders,
          'X-Socrata-Federation',
          'Honey Badger'
        );
      });
    });

    describe('on request error', () => {
      it('should return an Object containing "code", "error", and "message"', (done) => {
        metadataProvider.getDatasetMetadata().then(
          done,
          (error) => {
            assert.property(error, 'status');
            assert.equal(error.status, ERROR_STATUS);
            done();
          }
        ).catch(done);

        server.respond([ERROR_STATUS, {}, SAMPLE_METADATA_ERROR]);
      });
    });

    describe('on request success', () => {
      it('should return an Object of metadata', (done) => {
        metadataProvider.getDatasetMetadata().then(
          (data) => {
            assert.isObject(data);
            assert.property(data, 'columns');
            assert.isArray(data.columns);
            done();
          },
          done
        ).catch(done);

        server.respond([SUCCESS_STATUS, {'Content-Type': 'application/json'}, JSON.stringify(SAMPLE_DATASET_METADATA)]);
      });
    });
  });

  describe('getDatasetMigrationMetadata', () => {
    describe('on request error', () => {
      it('fails the promise', (done) => {
        metadataProvider.
          getDatasetMigrationMetadata().
          then(done).
          catch((error) => {
            assert.isObject(error);
            done();
          });

        server.respond([ERROR_STATUS, {'Content-Type': 'application/json'}, '{}']);
      });
    });

    describe('on request success', () => {
      it('should return an Object of metadata', (done) => {
        metadataProvider.
          getDatasetMigrationMetadata().
          then((data) => {
            assert.isObject(data);
            assert.property(data, 'nbeId');
            done();
          }).
          catch(done);

        server.respond([SUCCESS_STATUS, {'Content-Type': 'application/json'}, JSON.stringify(SAMPLE_MIGRATION_METADATA)]);
      });
    });
  });

  describe('isSystemColumn()', () => {
    it('returns true if and only if the column starts with :', () => {
      assert.isFalse(metadataProvider.isSystemColumn('foo', SAMPLE_DATASET_METADATA));
      assert.isFalse(metadataProvider.isSystemColumn('foo:', SAMPLE_DATASET_METADATA));
      assert.isFalse(metadataProvider.isSystemColumn('fo:o', SAMPLE_DATASET_METADATA));
      assert.isFalse(metadataProvider.isSystemColumn('@foo', SAMPLE_DATASET_METADATA));
      assert.isTrue(metadataProvider.isSystemColumn(':foo', SAMPLE_DATASET_METADATA));
    });
  });

  describe('isSubcolumn()', () => {
    it('returns true when there is a suffix', () => {
      const sampleDatasetMetadataWithExtraSimilarlyNamedColumns = _.cloneDeep(SAMPLE_DATASET_METADATA);

      sampleDatasetMetadataWithExtraSimilarlyNamedColumns.columns.push({
        "id" : _.uniqueId(),
        "name" : "Location 1",
        "dataTypeName" : "point",
        "fieldName" : "location_1",
        "position" : d3.max(_.map(SAMPLE_DATASET_METADATA.columns, 'position')) + 1,
        "renderTypeName" : "point",
        "tableColumnId" : _.uniqueId(),
        "format" : { }
      });

      sampleDatasetMetadataWithExtraSimilarlyNamedColumns.columns.push({
        "id" : _.uniqueId(),
        "name" : "Location 1 (city)",
        "dataTypeName" : "point",
        "fieldName" : "location_1_city",
        "position" : d3.max(_.map(SAMPLE_DATASET_METADATA.columns, 'position')) + 2,
        "renderTypeName" : "point",
        "tableColumnId" : _.uniqueId(),
        "format" : { }
      });

      assert.isFalse(metadataProvider.isSubcolumn(
        'location_1',
        sampleDatasetMetadataWithExtraSimilarlyNamedColumns
      ));

      assert.isTrue(metadataProvider.isSubcolumn(
        'location_1_city',
        sampleDatasetMetadataWithExtraSimilarlyNamedColumns
      ));
    });

    it('flags subcolumns when there is not a suffix', () => {
      assert.isFalse(metadataProvider.isSubcolumn('location', SAMPLE_DATASET_METADATA));
      assert.isTrue(metadataProvider.isSubcolumn('location_city', SAMPLE_DATASET_METADATA));
    });
  });

  describe('isHiddenColumn()', () => {
    it('returns true if the column flags includes "hidden"', () => {
      assert.isTrue(metadataProvider.isHiddenColumn(['hidden'], SAMPLE_DATASET_METADATA));
    });

    it('returns false if the column flags does not include "hidden"', () => {
      assert.isFalse(metadataProvider.isHiddenColumn(['potato'], SAMPLE_DATASET_METADATA));
    });

    it('returns false if the column flags is undefined', () => {
      assert.isFalse(metadataProvider.isHiddenColumn(undefined, SAMPLE_DATASET_METADATA));
    });
  });

  describe('getDisplayableColumns()', () => {
    const mockMetadata = {
      columns: [{
        fieldName: 'mockColumn'
      }]
    };

    it('excludes the column if isSystemColumn, isSubcolumn, or isHiddenColumn are true', () => {
      sinon.stub(metadataProvider, 'isSystemColumn', _.constant(true));
      sinon.stub(metadataProvider, 'isSubcolumn', _.constant(false));
      sinon.stub(metadataProvider, 'isHiddenColumn', _.constant(false));
      assert.lengthOf(metadataProvider.getDisplayableColumns(mockMetadata), 0);
      metadataProvider.isSystemColumn.restore();
      metadataProvider.isSubcolumn.restore();
      metadataProvider.isHiddenColumn.restore();

      sinon.stub(metadataProvider, 'isSystemColumn', _.constant(false));
      sinon.stub(metadataProvider, 'isSubcolumn', _.constant(true));
      sinon.stub(metadataProvider, 'isHiddenColumn', _.constant(false));
      assert.lengthOf(metadataProvider.getDisplayableColumns(mockMetadata), 0);
      metadataProvider.isSystemColumn.restore();
      metadataProvider.isSubcolumn.restore();
      metadataProvider.isHiddenColumn.restore();

      sinon.stub(metadataProvider, 'isSystemColumn', _.constant(false));
      sinon.stub(metadataProvider, 'isSubcolumn', _.constant(false));
      sinon.stub(metadataProvider, 'isHiddenColumn', _.constant(true));
      assert.lengthOf(metadataProvider.getDisplayableColumns(mockMetadata), 0);
      metadataProvider.isSystemColumn.restore();
      metadataProvider.isSubcolumn.restore();
      metadataProvider.isHiddenColumn.restore();

      sinon.stub(metadataProvider, 'isSystemColumn', _.constant(true));
      sinon.stub(metadataProvider, 'isSubcolumn', _.constant(true));
      sinon.stub(metadataProvider, 'isHiddenColumn', _.constant(true));
      assert.lengthOf(metadataProvider.getDisplayableColumns(mockMetadata), 0);
      metadataProvider.isSystemColumn.restore();
      metadataProvider.isSubcolumn.restore();
      metadataProvider.isHiddenColumn.restore();

      sinon.stub(metadataProvider, 'isSystemColumn', _.constant(false));
      sinon.stub(metadataProvider, 'isSubcolumn', _.constant(false));
      sinon.stub(metadataProvider, 'isHiddenColumn', _.constant(false));
      assert.deepEqual(
        metadataProvider.getDisplayableColumns(mockMetadata),
        mockMetadata.columns
      );
    });
  });

  describe('getFilterableColumns()', () => {
    it('returns money with rangeMin and rangeMax', () => {
      const columns = [
        {dataTypeName: 'money', fieldName: 'kitty'},
        {dataTypeName: 'money', fieldName: 'roomba', rangeMin: 1, rangeMax: 100}
      ];

      const filteredColumns = metadataProvider.getFilterableColumns({ columns });

      assert.deepEqual(filteredColumns, [columns[1]]);
    });

    it('returns numbers with rangeMin and rangeMax', () => {
      const columns = [
        {dataTypeName: 'number', fieldName: 'kitty'},
        {dataTypeName: 'number', fieldName: 'roomba', rangeMin: 1, rangeMax: 100}
      ];

      const filteredColumns = metadataProvider.getFilterableColumns({ columns });

      assert.deepEqual(filteredColumns, [columns[1]]);
    });

    it('returns text', () => {
      const columns = [
        {dataTypeName: 'number', fieldName: 'kitty'},
        {dataTypeName: 'text', fieldName: 'sparrow'}
      ];

      const filteredColumns = metadataProvider.getFilterableColumns({ columns });

      assert.deepEqual(filteredColumns, [columns[1]]);
    });

    it('returns calendar_date', () => {
      const columns = [
        {dataTypeName: 'number', fieldName: 'kitty'},
        {dataTypeName: 'calendar_date', fieldName: 'piggy'}
      ];

      const filteredColumns = metadataProvider.getFilterableColumns({ columns });

      assert.deepEqual(filteredColumns, [columns[1]]);
    });
  });

  describe('getDisplayableFilterableColumns', () => {
    beforeEach(() => {
      server.respondImmediately = true;
      server.respondWith('GET', 'https://example.com/api/views/test-test.json?read_from_nbe=true&version=2.1', [200, { 'Content-Type': 'application/json'}, JSON.stringify(SAMPLE_DATASET_METADATA)]);
      server.respondWith('GET', /api\/id/, [200, { 'Content-Type': 'application/json' }, JSON.stringify([{}])]);
    });

    afterEach(() => {
      server.restore();
    });

    it('returns only displayable and filterable columns', (done) => {
      return metadataProvider.getDisplayableFilterableColumns().then((columns) => {
        assert.deepEqual(metadataProvider.getFilterableColumns({ columns }), columns);
        assert.deepEqual(metadataProvider.getDisplayableColumns({ columns }), columns);
        done();
      });
    });
  });
});
