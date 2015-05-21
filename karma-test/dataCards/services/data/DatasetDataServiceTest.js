describe('DatasetDataService', function() {
  'use strict';

  var $httpBackend;
  var DatasetDataService;
  var TestHelpers;
  var fake4x4 = 'fake-data';

  var datasetMetadataUrlMatcher = new RegExp('/metadata/v1/dataset/{0}\\.json'.format(fake4x4));

  var fakeDatasetMetadataResponse = {
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

  var datasetPagesUrlMatcher = new RegExp('/metadata/v1/dataset/{0}/pages\\.json'.format(fake4x4));

  var fakePagesForDatasetResponse = {
    'fooo-barr': { pageId: 'fooo-barr', foo: 'bar' },
    'bazz-boop': { pageId: 'bazz-boop', baz: 'boop' }
  };

  var geoJsonInfoUrlMatcher = new RegExp('/resource/{0}\\.geojson'.format(fake4x4));
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
    $httpBackend.whenGET(datasetMetadataUrlMatcher).respond(fakeDatasetMetadataResponse);
    $httpBackend.whenGET(geoJsonInfoUrlMatcher).respond(fakeGeojsonInfoResponse);
    $httpBackend.whenGET(datasetPagesUrlMatcher).respond(fakePagesForDatasetResponse);
  }));

  describe('getDatasetMetadata', function() {

    it('should throw on bad parameters', function() {
      expect(function() { DatasetDataService.getDatasetMetadata(); }).to.throw();
      expect(function() { DatasetDataService.getDatasetMetadata(fake4x4); }).to.throw(); // Expect version.
      expect(function() { DatasetDataService.getDatasetMetadata('9001', fake4x4); }).to.throw(); // Invalid schema version.
    });

    var schemaVersion0 = '0';
    var schemaVersion1 = '1';

    it('should throw on a V0 request', function() {
      expect(function() { DatasetDataService.getDatasetMetadata(schemaVersion0, fake4x4); }).to.throw();
    });

    it('should return a v1 version of the dataset metadata', function(done) {
      var response = DatasetDataService.getDatasetMetadata(schemaVersion1, fake4x4);
      response.then(function(data) {
        expect(data).to.deep.equal(fakeDatasetMetadataResponse);
        done();
      });
      $httpBackend.flush();
    });

  });

  describe('getPagesForDataset', function() {
    it('should throw on bad parameters', function() {
      expect(function() { DatasetDataService.getPagesForDataset(); }).to.throw();
      expect(function() { DatasetDataService.getPagesForDataset('0'); }).to.throw();
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
        expect(response.data).to.eql(fakeGeojsonInfoResponse);
        done();
      });
      $httpBackend.flush();
    });
  });

});
