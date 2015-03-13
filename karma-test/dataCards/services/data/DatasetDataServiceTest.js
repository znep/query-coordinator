describe('DatasetDataService', function() {
  'use strict';

  var TESTED_MIGRATION_PHASES = [0, 1, 2];

  _.each(TESTED_MIGRATION_PHASES, function(phaseTestingUnder) {

    describe('under phase {0}'.format(phaseTestingUnder), function() {

      var $httpBackend;
      var DatasetDataService;
      var TestHelpers;
      var fake4x4 = 'fake-data';

      var datasetMetadataUrl = phaseTestingUnder === 0 ?
        '/dataset_metadata/{0}.json'.format(fake4x4) :
        '/metadata/v1/dataset/{0}.json'.format(fake4x4);

      var fakeDatasetMetadataResponseV0 = {
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
            title: 'Column 3 geo human name',
            name: ':@column_3_geo',
            logicalDatatype: 'location',
            physicalDatatype: 'number',
            importance: 3,
            description: 'Column 3 Geo human description.'
          }
        ]
      };

      var fakeDatasetMetadataResponseV1 = {
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
            description: 'Column 1.',
            cardinality: Math.pow(2, 53) - 1,
            defaultCardType: 'column',
            availableCardTypes: ['column', 'search']
          },
          column_2: {
            title: 'column_2',
            name: 'column_2',
            fred: 'category',
            physicalDatatype: 'number',
            description: 'Column 2.',
            cardinality: Math.pow(2, 53) - 1,
            defaultCardType: 'column',
            availableCardTypes: ['column', 'search']
          },
          ':@column_3_geo': {
            name: 'Column 3 geo human name',
            fred: 'location',
            physicalDatatype: 'number',
            description: 'Column 3 Geo human description.',
            cardinality: Math.pow(2, 53) - 1,
            computationStrategy: {
              parameters: {
                region: '_mash-apes'
              },
              'source_columns': ['point_column'],
              'strategy_type': 'georegion_match_on_point'
            },
            defaultCardType: 'choropleth',
            availableCardTypes: ['choropleth']
          }
        }
      };

      // This is fakeDatasetMetadataResponseV1 as it should appear for
      // callers requesting a v0 blob.
      // The only difference between this and fakeDatasetMetadataResponseV1
      // is that fred is once again logicalDatatype, the columns
      // are represented as an array of hashes, and shapefile is
      // pulled from computationStrategy.
      var fakeDatasetMetadataResponseV1RepresentedAsV0 = {
        id: fake4x4,
        name: 'Test Data',
        description: 'Test description.',
        rowDisplayUnit: 'rowDisplayUnit',
        defaultAggregateColumn: 'defaultAggregateColumn',
        domain: 'config.ru',
        ownerId: 'flim-flam',
        updatedAt: '2014-09-19T16:33:59.000-07:00',
        columns: [
          // NOTE: When converting to v0, columns are sorted lexicographically.
          // V1 metadata does not include ordering information.
          {
            title: 'Column 3 geo human name',
            name: ':@column_3_geo',
            logicalDatatype: 'location',
            physicalDatatype: 'number',
            description: 'Column 3 Geo human description.',
            shapefile: 'mash-apes',
            importance: 1,
            cardinality: Math.pow(2, 53) - 1,
            computationStrategy: {
              parameters: {
                region: '_mash-apes'
              },
              'source_columns': ['point_column'],
              'strategy_type': 'georegion_match_on_point'
            },
            defaultCardType: 'choropleth',
            availableCardTypes: ['choropleth']
          },
          {
            title: 'column_1',
            name: 'column_1',
            logicalDatatype: 'identifier',
            physicalDatatype: 'text',
            description: 'Column 1.',
            importance: 1,
            cardinality: Math.pow(2, 53) - 1,
            defaultCardType: 'column',
            availableCardTypes: ['column', 'search']
          },
          {
            title: 'column_2',
            name: 'column_2',
            logicalDatatype: 'category',
            physicalDatatype: 'number',
            description: 'Column 2.',
            importance: 1,
            cardinality: Math.pow(2, 53) - 1,
            defaultCardType: 'column',
            availableCardTypes: ['column', 'search']
          }
        ]
      };

      var fakeDatasetMetadataResponse = phaseTestingUnder === 0 ? fakeDatasetMetadataResponseV0 : fakeDatasetMetadataResponseV1;

      var datasetPagesUrl = phaseTestingUnder === 0 ?
        '/dataset_metadata/?id={0}&format=json'.format(fake4x4) :
        '/metadata/v1/dataset/{0}/pages.json'.format(fake4x4);

      var fakePagesForDatasetResponseV0 = {
        publisher: [
          { pageId: 'fooo-barr', foo: 'bar' },
          { pageId: 'bazz-boop', baz: 'boop' }
        ],
        user: []
      };

      var fakePagesForDatasetResponseV1 = {
        'fooo-barr': { pageId: 'fooo-barr', foo: 'bar' },
        'bazz-boop': { pageId: 'bazz-boop', baz: 'boop' }
      };

      var fakePagesForDatasetResponse = phaseTestingUnder === 0 ? fakePagesForDatasetResponseV0 : fakePagesForDatasetResponseV1;

      var geoJsonInfoUrl = '/resource/{0}.geojson'.format(fake4x4);
      var fakeGeojsonInfoResponse = {
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
        TestHelpers = $injector.get('testHelpers');
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.whenGET(datasetMetadataUrl).respond(fakeDatasetMetadataResponse);
        $httpBackend.whenGET(geoJsonInfoUrl).respond(fakeGeojsonInfoResponse);
        $httpBackend.whenGET(datasetPagesUrl).respond(fakePagesForDatasetResponse);

        TestHelpers.overrideMetadataMigrationPhase(phaseTestingUnder);
      }));

      describe('getDatasetMetadata', function() {

        it('should throw on bad parameters', function() {
          expect(function() { DatasetDataService.getDatasetMetadata(); }).to.throw();
          expect(function() { DatasetDataService.getDatasetMetadata(fake4x4); }).to.throw(); // Expect version.
          expect(function() { DatasetDataService.getDatasetMetadata('9001', fake4x4); }).to.throw(); // Invalid schema version.
        });

        // This test is only relevant for phases 0 and 1.
        if (phaseTestingUnder < 2) {
          it('should return a v0 version of the dataset metadata', function(done) {
            var response = DatasetDataService.getDatasetMetadata('0', fake4x4);
            response.then(function(data) {
              if (phaseTestingUnder === 0) {
                expect(data).to.deep.equal(fakeDatasetMetadataResponseV0);
              } else if (phaseTestingUnder === 1) {
                expect(data).to.deep.equal(fakeDatasetMetadataResponseV1RepresentedAsV0);
              } else {
                throw new Error('this test needs to be updated to support phase {0}'.format(phaseTestingUnder));
              }
              done();
            });
            $httpBackend.flush();
          });
        }

        // These tests are only relevant for phase 2.
        if (phaseTestingUnder === 2) {
          var schemaVersion0 = '0';
          var schemaVersion1 = '1';

          it('should throw on a V0 request', function() {
            expect(function() { DatasetDataService.getDatasetMetadata(schemaVersion0, fake4x4); }).to.throw();
          });

          it('should return a v1 version of the dataset metadata', function(done) {
            var response = DatasetDataService.getDatasetMetadata(schemaVersion1, fake4x4);
            response.then(function(data) {
              expect(data).to.deep.equal(fakeDatasetMetadataResponseV1);
              done();
            });
            $httpBackend.flush();
          });
        }

      });

      describe('getPagesForDataset', function() {
        it('should throw on bad parameters', function() {
          expect(function() { DatasetDataService.getPagesForDataset(); }).to.throw();
          expect(function() { DatasetDataService.getPagesForDataset('0'); }).to.throw();
        });

        it('should return the correct data', function(done) {
          var responsePromise = DatasetDataService.getPagesForDataset('0', fake4x4);
          responsePromise.then(function(response) {
            // Response should be equvalent to v0 in all cases.
            expect(response).to.eql(fakePagesForDatasetResponseV0);
            done();
          });
          $httpBackend.flush();
        })
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
            expect(response.data).to.eql(fakeGeojsonInfoResponse);
            done();
          });
          $httpBackend.flush();
        })
      });

    })
  });
});
