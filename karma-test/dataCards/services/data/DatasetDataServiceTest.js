(function() {
  'use strict';

  var TESTED_MIGRATION_PHASES = [0, 1];

  _.each(TESTED_MIGRATION_PHASES, function(phaseTestingUnder) {
    describe('DatasetDataService', function() {
      var $httpBackend;
      var DatasetDataService;
      var ServerConfig;
      var TestHelpers;
      var fake4x4 = 'fake-data';

      var datasetDataUrl = phaseTestingUnder === 0 ?
        '/dataset_metadata/{0}.json'.format(fake4x4) :
        '/metadata/v1/dataset/{0}'.format(fake4x4);

      var fakeDatasetDataV0 = {
        id: fake4x4,
        name: 'Test Data',
        description: 'Test description.',
        rowDisplayUnit: 'rowDisplayUnit',
        defaultAggregateColumn: 'defaultAggregateColumn',
        domain: 'config.ru',
        ownerId: 'flim-flam',
        updatedAt: '2014-09-19T16:33:59.000-07:00',
        columns: [
          {
            title: 'column_1',
            name: 'column_1',
            logicalDatatype: 'identifier',
            physicalDatatype: 'text',
            importance: 3,
            description: 'Column 1.'
          },
          {
            title: 'column_2',
            name: 'column_2',
            logicalDatatype: 'category',
            physicalDatatype: 'number',
            importance: 3,
            description: 'Column 2.'
          },
          {
            title: 'column_3_geo',
            name: 'column_3_geo',
            logicalDatatype: 'location',
            physicalDatatype: 'number',
            importance: 3,
            description: 'Column 3 Geo.'
          }
        ]
      };

      var fakeDatasetDataV1 = {
        id: fake4x4,
        name: 'Test Data',
        description: 'Test description.',
        rowDisplayUnit: 'rowDisplayUnit',
        defaultAggregateColumn: 'defaultAggregateColumn',
        domain: 'config.ru',
        ownerId: 'flim-flam',
        updatedAt: '2014-09-19T16:33:59.000-07:00',
        columns: {
          column_1: {
            title: 'column_1',
            name: 'column_1',
            fred: 'identifier',
            physicalDatatype: 'text',
            description: 'Column 1.'
          },
          column_2: {
            title: 'column_2',
            name: 'column_2',
            fred: 'category',
            physicalDatatype: 'number',
            description: 'Column 2.'
          },
          column_3_geo: {
            title: 'column_3_geo',
            name: 'column_3_geo',
            fred: 'location',
            physicalDatatype: 'number',
            description: 'Column 3 Geo.',
            computationStrategy: {
              parameters: {
                region: 'shap-fil3',
                geometryLabel: 'someLabelField'
              }
            }
          }
        }
      };

      // This is fakeDatasetDataV1 as it should appear for
      // callers requesting a v0 blob.
      // The only difference between this and fakeDatasetDataV1
      // is that fred is once again logicalDatatype, the columns
      // are represented as an array of hashes, and shapefile is
      // pulled from computationStrategy.
      var fakeDatasetDataV1RepresentedAsV0 = {
        id: fake4x4,
        name: 'Test Data',
        description: 'Test description.',
        rowDisplayUnit: 'rowDisplayUnit',
        defaultAggregateColumn: 'defaultAggregateColumn',
        domain: 'config.ru',
        ownerId: 'flim-flam',
        updatedAt: '2014-09-19T16:33:59.000-07:00',
        columns: [
          {
            title: 'column_1',
            name: 'column_1',
            logicalDatatype: 'identifier',
            physicalDatatype: 'text',
            description: 'Column 1.',
            importance: 1,
            cardinality: Math.pow(2, 53) - 1
          },
          {
            title: 'column_2',
            name: 'column_2',
            logicalDatatype: 'category',
            physicalDatatype: 'number',
            description: 'Column 2.',
            importance: 1,
            cardinality: Math.pow(2, 53) - 1
          },
          {
            title: 'column_3_geo',
            name: 'column_3_geo',
            logicalDatatype: 'location',
            physicalDatatype: 'number',
            description: 'Column 3 Geo.',
            shapefile: 'shap-fil3',
            importance: 1,
            cardinality: Math.pow(2, 53) - 1
          }
        ]
      };

      var fakeDatasetData = phaseTestingUnder === 0 ? fakeDatasetDataV0 : fakeDatasetDataV1;

      var geoJsonDataUrl = '/resource/{0}.geojson'.format(fake4x4);
      var fakeGeoJsonData = {
        type: 'FeatureCollection',
        features: [],
        crs: {
          type: 'name',
          properties: {
            name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
          }
        }
      };

      beforeEach(module('dataCards'));

      beforeEach(inject(function($injector) {
        DatasetDataService = $injector.get('DatasetDataService');
        ServerConfig = $injector.get('ServerConfig');
        TestHelpers = $injector.get('testHelpers');
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.whenGET(datasetDataUrl).respond(fakeDatasetData);
        $httpBackend.whenGET(geoJsonDataUrl).respond(fakeGeoJsonData);

        TestHelpers.overrideMetadataMigrationPhase(phaseTestingUnder);
      }));

      describe('getDatasetMetadata', function() {
        it('should throw on bad parameters', function() {
          expect(function() { DatasetDataService.getDatasetMetadata(); }).to.throw();
          expect(function() { DatasetDataService.getDatasetMetadata(fake4x4); }).to.throw(); // Expect version.
          expect(function() { DatasetDataService.getDatasetMetadata('9001', fake4x4); }).to.throw(); // Invalid schema version.
        });

        it('should return a v0 version of the dataset metadata (regardless of phase)', function(done) {
          var response = DatasetDataService.getDatasetMetadata('0', fake4x4);
          response.then(function(data) {
            if (phaseTestingUnder === 0) {
              expect(data).to.deep.equal(fakeDatasetDataV0);
            } else {
              expect(data).to.deep.equal(fakeDatasetDataV1RepresentedAsV0);
            }
            done();
          });
          $httpBackend.flush();
        });
      });

      describe('getGeoJsonInfo', function() {
        it('should throw on bad parameters', function() {
          expect(function() { DatasetDataService.getGeoJsonInfo(); }).to.throw();
        });

        it('should access the correct dataset geojson data', function(done) {
          var responsePromise = DatasetDataService.getGeoJsonInfo(fake4x4);
          responsePromise.then(function(response) {
            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
            expect(response.data).to.eql(fakeGeoJsonData);
            done();
          });
          $httpBackend.flush();
        })
      });

    })
  });
})();
