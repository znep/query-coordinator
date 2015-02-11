describe('CardVisualizationChoroplethHelpers service', function() {

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

      it('should log errors for invalid v1 dataset metadata columns', function() {

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

    describe('when extracting a geometryLabel', function() {

      it('should log warnings for invalid v1 dataset metadata columns', function() {

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

        sinon.spy($log, 'warn');

        delete validColumn.computationStrategy.parameters['geometryLabel'];
        expect(cardVisualizationChoroplethHelpers.extractGeometryLabelFromColumn(validColumn)).to.equal(null);

        delete validColumn.computationStrategy['parameters'];
        expect(cardVisualizationChoroplethHelpers.extractGeometryLabelFromColumn(validColumn)).to.equal(null);

        delete validColumn['computationStrategy'];
        expect(cardVisualizationChoroplethHelpers.extractGeometryLabelFromColumn(validColumn)).to.equal(null);

        expect($log.warn.calledThrice);
        $log.warn.restore();

      });

      it('should extract a geometryLabel from a v1 dataset metadata columns', function() {

        var validGeometryLabel = 'geoid10';

        var validColumn = {
          "computationStrategy": {
            "parameters": {
              "region": "_c8h8-ygvf",
              "geometryLabel": validGeometryLabel
            },
            "strategy_type": "georegion_match_on_point"
          },
          "description": "descr",
          "fred": "location",
          "name": "computed_column human readable name",
          "physicalDatatype": "text"
        };

        expect(cardVisualizationChoroplethHelpers.extractGeometryLabelFromColumn(validColumn)).to.equal(validGeometryLabel);

      });

    });

  });

});
