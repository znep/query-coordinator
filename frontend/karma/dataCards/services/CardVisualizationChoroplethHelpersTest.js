import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('CardVisualizationChoroplethHelpers service', function() {
  'use strict';

  var cardVisualizationChoroplethHelpers;
  var $log;

  beforeEach(function() {
    angular.mock.module('dataCards');
    inject(function($injector) {

      cardVisualizationChoroplethHelpers = $injector.get('CardVisualizationChoroplethHelpers');
      $log = $injector.get('$log');

    });
  });

  describe('in metadata transition phase 1', function() {

    describe('when extracting a shapefile', function() {

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

      it('should extract a shapefile from a v1 dataset metadata columns', function() {

        var validShapefile = 'c8h8-ygvf';

        var validColumn = {
          "computationStrategy": {
            "parameters": {
              "region": "_" + validShapefile,
              "geometryLabel": "geoid10"
            },
            "strategy_type": "georegion_match_on_point"
          },
          "description": "descr",
          "name": "computed_column human readable name",
          "physicalDatatype": "text"
        };

        expect(cardVisualizationChoroplethHelpers.extractShapeFileFromColumn(validColumn)).to.equal(validShapefile);

      });

    });

  });

  describe('#computedColumnNameToShapefileId', function() {
    it('should convert a computed column name to its shapefile ID', function() {
      expect(cardVisualizationChoroplethHelpers.computedColumnNameToShapefileId(':@computed_region_skmb_8uxu')).to.eq('skmb-8uxu');
    });
  });

});
