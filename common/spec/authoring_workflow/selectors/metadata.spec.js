import _ from 'lodash';

import vifs from 'common/authoring_workflow/vifs';
import * as selector from 'common/authoring_workflow/selectors/metadata';
import { VISUALIZATION_TYPES, COLUMN_TYPES } from 'common/authoring_workflow/constants';

function getDefaultState() {
  return {
    data: {
      columns: [
        {renderTypeName: 'text', fieldName: 'text', name: 'text'},
        {renderTypeName: 'number', fieldName: 'number', name: 'number'},
        {renderTypeName: 'point', fieldName: 'point', name: 'point'},
        {renderTypeName: 'location', fieldName: 'location', name: 'location'},
        {renderTypeName: 'calendar_date', fieldName: 'calendar_date', name: 'calendar date'},
        {renderTypeName: 'money', fieldName: 'money', name: 'money'},
        {renderTypeName: 'percent', fieldName: 'percent', name: 'percent' }
      ]
    },
    domain: 'test.domain',
    datasetUid: 'xxxx-xxxx'
  };
}

describe('metadata', function() {
  describe('getRecommendedDimensions', function() {
    function returnsRecommendedDimensions(type) {
      it('returns a list of recommended types', function() {
        var types = selector.getRecommendedDimensions(getDefaultState(), type);
        var visualizationType = _.find(VISUALIZATION_TYPES, visualization => visualization.type == type);

        expect(types).to.have.length.above(0);
        expect(visualizationType).to.exist;

        var areCorrectRecommendedTypes = _.every(types, function(type) {
          return _.includes(visualizationType.preferredDimensionTypes, type.renderTypeName);
        });

        expect(areCorrectRecommendedTypes).to.be.true;
      });
    }

    describe('regionMap', function() {
      returnsRecommendedDimensions('regionMap');
    });

    describe('columnChart', function() {
      returnsRecommendedDimensions('columnChart');
    });

    describe('featureMap', function() {
      returnsRecommendedDimensions('featureMap');
    });

    describe('timelineChart', function() {
      returnsRecommendedDimensions('timelineChart');
    });
  });

  describe('getRecommendedVisualizationTypes', function() {
    function returnsRecommendedVisualizationType(dimension) {
      it('returns a list of recommended visualization types', function() {
        var types = selector.getRecommendedVisualizationTypes(getDefaultState(), {columnName: dimension});
        var columnType = _.find(COLUMN_TYPES, column => column.type === dimension);

        expect(types).to.have.length.above(0);
        expect(columnType).to.exist;

        var areCorrectRecommendedTypes = _.every(types, function(visualization) {
          return _.includes(columnType.preferredVisualizationTypes, visualization.type);
        });

        expect(areCorrectRecommendedTypes).to.be.true;
      });
    }

    describe('text', function() {
      returnsRecommendedVisualizationType('text');
    });

    describe('number', function() {
      returnsRecommendedVisualizationType('number');
    });

    describe('point', function() {
      returnsRecommendedVisualizationType('point');
    });

    describe('calendar_date', function() {
      returnsRecommendedVisualizationType('calendar_date');
    });

    describe('money', function() {
      returnsRecommendedVisualizationType('money');
    });

    describe('percent', function() {
      returnsRecommendedVisualizationType('percent');
    });
  });
});
