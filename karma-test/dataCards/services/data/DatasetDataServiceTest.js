(function() {
  'use strict';

  describe('DatasetDataService', function() {
    var $httpBackend;
    var DatasetDataService;
    var ServerConfig;
    var TestHelpers;
    var fake4x4 = 'fake-data';
    var datasetDataUrl = '/dataset_metadata/{0}.json'.format(fake4x4);
    var fakeDatasetData = {
      id: 'fake-data',
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
        }
      ]
    };

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

      ServerConfig.setup(
        {
          metadataTransitionPhase: '0'
        }
      );
    }));

    describe('getDatasetMetadata', function() {
      it('should throw on bad parameters', function() {
        expect(function() { DatasetDataService.getDatasetMetadata(); }).to.throw();
        expect(function() { DatasetDataService.getDatasetMetadata(fake4x4); }).to.throw(); // Expect version.
        expect(function() { DatasetDataService.getDatasetMetadata('9001', fake4x4); }).to.throw(); // Invalid schema version.
      });

      it('should access the correct dataset metadata', function(done) {
        var response = DatasetDataService.getDatasetMetadata('0', fake4x4);
        response.then(function(data) {
          expect(data).to.eql(fakeDatasetData);
          done();
        });
        $httpBackend.flush();
      });

      it('should throw in phase 1 migration', function() {
        // NOTE: This should change soon.
        TestHelpers.overrideMetadataMigrationPhase(1);
        expect(function() {
          DatasetDataService.getDatasetMetadata('0', fake4x4);
        }).to.throw();
      });

      it('should throw in phase 2 migration', function() {
        TestHelpers.overrideMetadataMigrationPhase(2);
        expect(function() {
          DatasetDataService.getDatasetMetadata('0', fake4x4);
        }).to.throw();
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

})();
