// This suite verifies the integration between DatasetDataService and Dataset models
// for Phase 1 of the metadata migration.
// This tests that:
// - DatasetDataService can convert V1 metadata blobs to V0, and
// - Dataset model can consume this converted V0 blob.
describe('Instantiating v0 models from v1 metadata', function() {
  var Dataset;
  var $httpBackend;

  beforeEach(function() {
    module('dataCards');
    inject(function($injector, testHelpers) {
      Dataset = $injector.get('Dataset');
      $httpBackend = $injector.get('$httpBackend');
      testHelpers.overrideMetadataMigrationPhase(1);
    });
  });

  function constructWithV1Blob(v1Blob) {
    var datasetDataUrl = '/metadata/v1/dataset/{0}'.format(v1Blob.id);
    $httpBackend.whenGET(datasetDataUrl).respond(v1Blob);
    return new Dataset(v1Blob.id);
  }

  it('should convert computed columns correctly', function(done) {
    // Case 1 in "Rationalizing Page and Dataset Metadata"
    var input = {
      "columns":{
        ":@computed_column":{
          "computationStrategy": {
            "parameters": {
              "region": "_c8h8-ygvf",
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point"
          },
          "description": "",
          "fred": "location",
          "name": ":@computed_column",
          "physicalDatatype": "text"
        }
      },
      "defaultPage": "four-four",
      "description": "Cases created since 7/1/2008 with location information",
      "domain": "dataspace-demo.test-socrata.com",
      "id": "vtvh-wqgq",
      "locale": "en_US",
      "name": "Case Data from San Francisco 311",
      "ownerId": "8ueb-zucv",
      "updatedAt": "2014-08-17T04:07:03.000Z",
    };

    var dataset = constructWithV1Blob(input);

    Rx.Observable.subscribeLatest(
      dataset.observe('columns').filter(_.isPresent),
      dataset.observe('rowDisplayUnit').filter(_.isPresent),
      function(columns, rowDisplayUnit) {
        var geoColumn = columns[':@computed_column'];
        expect(geoColumn).to.have.property('shapefile', 'c8h8-ygvf');
        expect(geoColumn).to.have.property('logicalDatatype', 'location');
        expect(geoColumn).to.have.property('cardinality', Math.pow(2, 53) - 1);

        expect(rowDisplayUnit).to.equal('row');

        done();
      });

    $httpBackend.flush();
  });

  it('should preserve rowDisplayUnit if it is set in the V1 blob', function(done) {
    // Case 2 in "Rationalizing Page and Dataset Metadata"
    var input = {
      "columns":{
        "some_column":{
          "cardinality": 25,
          "description": "",
          "fred": "category",
          "name": "some_column",
          "title": "Some Category Column",
          "physicalDatatype": "number"
        }
      },
      "defaultPage": "four-four",
      "description": "Cases created since 7/1/2008 with location information",
      "domain": "dataspace-demo.test-socrata.com",
      "id": "vtvh-wqgq",
      "locale": "en_US",
      "name": "Case Data from San Francisco 311",
      "ownerId": "8ueb-zucv",
      "updatedAt": "2014-08-17T04:07:03.000Z"
    };

    var dataset = constructWithV1Blob(input);

    Rx.Observable.subscribeLatest(
      dataset.observe('columns').filter(_.isPresent),
      dataset.observe('rowDisplayUnit').filter(_.isPresent),
      function(columns, rowDisplayUnit) {
        var someColumn = columns['some_column'];
        expect(someColumn).to.have.property('cardinality', 25);
        expect(someColumn).to.have.property('logicalDatatype', 'category');

        expect(rowDisplayUnit).to.equal('row');

        done();
      });

    $httpBackend.flush();
  });

  it('should preserve rowDisplayUnit if it is set in the V1 blob', function(done) {
    // Case 3 in "Rationalizing Page and Dataset Metadata"
    var input = {
      "columns":{
        "some_column":{
          "description": "",
          "fred": "category",
          "name": "some_column",
          "physicalDatatype": "number"
        }
      },
      "defaultPage": "four-four",
      "description": "Cases created since 7/1/2008 with location information",
      "domain": "dataspace-demo.test-socrata.com",
      "id": "vtvh-wqgq",
      "locale": "en_US",
      "name": "Case Data from San Francisco 311",
      "ownerId": "8ueb-zucv",
      "rowDisplayUnit": "Case",
      "updatedAt": "2014-08-17T04:07:03.000Z"
    };

    var dataset = constructWithV1Blob(input);

    Rx.Observable.subscribeLatest(
      dataset.observe('columns').filter(_.isPresent),
      dataset.observe('rowDisplayUnit').filter(_.isPresent),
      function(columns, rowDisplayUnit) {
        var someColumn = columns['some_column'];
        expect(someColumn).to.have.property('cardinality', Math.pow(2, 53) - 1);
        expect(someColumn).to.have.property('logicalDatatype', 'category');

        expect(rowDisplayUnit).to.equal('Case');

        done();
      });

    $httpBackend.flush();
  });
});
