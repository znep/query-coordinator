(function() {
  'use strict';

  describe('DatasetDataService', function() {
    var $httpBackend;
    var DatasetDataService;
    var ServerConfig;
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
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.whenGET(datasetDataUrl).respond(fakeDatasetData);
      $httpBackend.whenGET(geoJsonDataUrl).respond(fakeGeoJsonData);
    }));

    describe('getBaseInfo', function() {
      it('should throw on bad parameters', function() {
        expect(function() { DatasetDataService.getBaseInfo(); }).to.throw();
      });

      it('should access the correct dataset metadata', function(done) {
        var response = DatasetDataService.getBaseInfo(fake4x4);
        response.then(function(data) {
          expect(data).to.eql(fakeDatasetData);
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

})();
