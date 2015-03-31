describe('CardVisualizationChoroplethHelpers service', function() {
  'use strict';

  var cardVisualizationChoroplethHelpers;
  var $log;

  beforeEach(function() {
    module('dataCards');
    inject(function($injector) {

      cardVisualizationChoroplethHelpers = $injector.get('CardVisualizationChoroplethHelpers');
      $log = $injector.get('$log');

    });
  });

  describe('in metadata transition phase 1', function() {

    describe('when extracting a shapeFile', function() {

      it('should log errors if the region is not present in a v1 dataset metadata column', function() {

        var validColumn = {
          "computationStrategy": {
            "parameters": {
              "region": "_c8h8-ygvf",
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point"
          },
          "description": "descr",
          "fred": "location",
          "name": "computed_column human readable name",
          "physicalDatatype": "text"
        };

        sinon.spy($log, 'error');

        delete validColumn.computationStrategy.parameters['region'];
        expect(cardVisualizationChoroplethHelpers.extractShapeFileFromColumn(validColumn)).to.equal(null);

        delete validColumn.computationStrategy['parameters'];
        expect(cardVisualizationChoroplethHelpers.extractShapeFileFromColumn(validColumn)).to.equal(null);

        delete validColumn['computationStrategy'];
        expect(cardVisualizationChoroplethHelpers.extractShapeFileFromColumn(validColumn)).to.equal(null);

        expect($log.error.calledThrice);
        $log.error.restore();

      });

      it('should extract a shapeFile from a v1 dataset metadata columns', function() {

        var validShapeFile = 'c8h8-ygvf';

        var validColumn = {
          "computationStrategy": {
            "parameters": {
              "region": "_" + validShapeFile,
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point"
          },
          "description": "descr",
          "fred": "location",
          "name": "computed_column human readable name",
          "physicalDatatype": "text"
        };

        expect(cardVisualizationChoroplethHelpers.extractShapeFileFromColumn(validColumn)).to.equal(validShapeFile);

      });

    });

    describe('when extracting a sourceColumn', function() {

      it('should log errors if source columns are not present in a v1 dataset metadata column', function() {

        var validColumn = {
          "computationStrategy": {
            "parameters": {
              "region": "_c8h8-ygvf",
              "geometryLabel": "geoid10"
            },
            "source_columns": ['source_column_field_name'],
            "strategy_type": "georegion_match_on_point"
          },
          "description": "descr",
          "fred": "location",
          "name": "computed_column human readable name",
          "physicalDatatype": "text"
        };

        sinon.spy($log, 'error');

        validColumn.computationStrategy['source_columns'] = [];

        expect(cardVisualizationChoroplethHelpers.extractSourceColumnFromColumn(validColumn)).to.equal(null);

        delete validColumn.computationStrategy['source_columns'];
        expect(cardVisualizationChoroplethHelpers.extractSourceColumnFromColumn(validColumn)).to.equal(null);

        delete validColumn['computationStrategy'];
        expect(cardVisualizationChoroplethHelpers.extractSourceColumnFromColumn(validColumn)).to.equal(null);

        expect($log.error.calledThrice);
        $log.error.restore();

      });

      it('should extract a source column from a v1 dataset metadata columns', function() {

        var validSourceColumn = 'source_column_field_name';

        var validColumn = {
          "computationStrategy": {
            "parameters": {
              "region": "_c8h8-ygvf",
              "geometryLabel": "geoid10"
            },
            "source_columns": [validSourceColumn],
            "strategy_type": "georegion_match_on_point"
          },
          "description": "descr",
          "fred": "location",
          "name": "computed_column human readable name",
          "physicalDatatype": "text"
        };

        expect(cardVisualizationChoroplethHelpers.extractSourceColumnFromColumn(validColumn)).to.equal(validSourceColumn);

      });

    });

  });

});
