// This suite verifies the integration between DatasetDataService and DatasetV0 models
// for Phase 1 of the metadata migration.
// This tests that:
// - DatasetDataService can convert V1 metadata blobs to V0, and
// - DatasetV0 model can consume this converted V0 blob.
describe('Using v1 metadata to instantiate v0 models', function() {
  var DatasetV0;
  var $httpBackend;

  beforeEach(function() {
    module('dataCards');
    inject(function($injector, testHelpers) {
      DatasetV0 = $injector.get('DatasetV0');
      $httpBackend = $injector.get('$httpBackend');
      testHelpers.overrideMetadataMigrationPhase(1);
    });
  });

  function constructWithV1Blob(v1Blob) {
    var datasetDataUrl = '/metadata/v1/dataset/{0}.json'.format(v1Blob.id);
    $httpBackend.whenGET(datasetDataUrl).respond(v1Blob);
    return new DatasetV0(v1Blob.id);
  }

  it('should convert computed columns correctly', function(done) {
    // Case 1 in "Rationalizing Page and Dataset Metadata"
    var v1Input = {
      "columns":{
        ":@computed_column":{
          "computationStrategy": {
            "parameters": {
              "region": "_c8h8-ygvf",
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point",
            "source_columns": ["point_column"]
          },
          "description": "descr",
          "fred": "location",
          "name": "computed_column human readable name",
          "physicalDatatype": "text",
          "defaultCardType": "choropleth",
          "availableCardTypes": ["choropleth"]
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

    var dataset = constructWithV1Blob(v1Input);

    Rx.Observable.subscribeLatest(
      dataset.observe('columns').filter(_.isPresent),
      dataset.observe('rowDisplayUnit').filter(_.isPresent),
      function(columns, rowDisplayUnit) {
        var geoColumn = columns[':@computed_column'];
        expect(geoColumn).to.have.property('shapefile', 'c8h8-ygvf');
        expect(geoColumn).to.have.property('logicalDatatype', 'location');
        expect(geoColumn).to.have.property('cardinality', Math.pow(2, 53) - 1);
        expect(rowDisplayUnit).to.equal('row');

        // Additional assertions not in doc
        expect(geoColumn).to.have.property('name', ':@computed_column');
        expect(geoColumn).to.have.property('title', 'computed_column human readable name');
        expect(geoColumn).to.have.property('description', 'descr');

        done();
      });

    $httpBackend.flush();
  });

  it('should default rowDisplayUnit to "row" if it is not set in the V1 blob', function(done) {
    // Case 2 in "Rationalizing Page and Dataset Metadata"
    var v1Input = {
      "columns":{
        "some_column":{
          "cardinality": 25,
          "description": "",
          "fred": "category",
          "name": "some_column",
          "title": "Some Category Column",
          "physicalDatatype": "number",
          "defaultCardType": "column",
          "availableCardTypes": ["column", "search"]
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

    var dataset = constructWithV1Blob(v1Input);

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
    var v1Input = {
      "columns":{
        "some_column":{
          "description": "",
          "fred": "category",
          "name": "some_column",
          "physicalDatatype": "number",
          "defaultCardType": "column",
          "availableCardTypes": ["column", "search"]
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

    var dataset = constructWithV1Blob(v1Input);

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

  it('should convert the list of pages for a dataset correctly', function(done) {
    var v1Input = {
      "columns":{
        "column_a":{
          "description": "",
          "fred": "category",
          "physicalDatatype": "text",
          "name": "column_a"
        }
      },
      "defaultPage": "four-four",
      "description": "test",
      "domain": "dataspace-demo.test-socrata.com",
      "id": "vtvh-wqgq",
      "locale": "en_US",
      "name": "test",
      "ownerId": "8ueb-zucv",
      "updatedAt": "2014-08-17T04:07:03.000Z",
    };

    var datasetPagesDataUrl = '/metadata/v1/dataset/{0}/pages.json'.format(v1Input.id);
    $httpBackend.whenGET(datasetPagesDataUrl).respond({
      'page-zero': {
        'pageId': 'page-zero',
        'description': 'zero'
      },
      'page-one3': {
        'pageId': 'page-one3',
        'description': 'one'
      }
    });

    var dataset = constructWithV1Blob(v1Input);

    dataset.observe('pages').filter(_.isPresent).subscribe(function(pages) {
      expect(pages.user).to.have.length(0);
      expect(pages.publisher).to.have.length(2);
      Rx.Observable.subscribeLatest(
        pages.publisher[0].observe('description').filter(_.isPresent),
        pages.publisher[0].observe('id'),
        pages.publisher[1].observe('description').filter(_.isPresent),
        pages.publisher[1].observe('id'),
        function(pageDescriptionA, pageIdA, pageDescriptionB, pageIdB) {
          // Since the new style is a hash, ordering is not guaranteed.
          var pageAIsPageZero = pageIdA === 'page-zero';

          var page0Id = pageAIsPageZero ? pageIdA : pageIdB;
          var page0Description = pageAIsPageZero ? pageDescriptionA : pageDescriptionB;

          var page1Id = pageAIsPageZero ? pageIdB : pageIdA;
          var page1Description = pageAIsPageZero ? pageDescriptionB : pageDescriptionA;

          expect(page0Id).to.equal('page-zero');
          expect(page1Id).to.equal('page-one3');

          expect(page0Description).to.equal('zero');
          expect(page1Description).to.equal('one');

          done();
        }
      )
    });

    $httpBackend.flush();
  });

});
