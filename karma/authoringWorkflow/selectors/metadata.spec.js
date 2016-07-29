import _ from 'lodash';

import vifs from 'src/authoringWorkflow/vifs';
import * as selector from 'src/authoringWorkflow/selectors/metadata';
import { VISUALIZATION_TYPES, COLUMN_TYPES } from 'src/authoringWorkflow/constants';

function getDefaultState() {
  return {
    data: {
      columns: [
        {renderTypeName: 'text', fieldName: 'text'},
        {renderTypeName: 'number', fieldName: 'number'},
        {renderTypeName: 'point', fieldName: 'point'},
        {renderTypeName: 'location', fieldName: 'location'},
        {renderTypeName: 'calendar_date', fieldName: 'calendar_date'}
      ]
    },
    phidippidesMetadata: {
      columns: {
        'text': {renderTypeName: 'text', name: 'Text'},
        'number': {renderTypeName: 'number', name: 'Number'},
        'point': {renderTypeName: 'point', name: 'Point'},
        'location': {renderTypeName: 'location', name: 'Location'},
        'calendar_date': {renderTypeName: 'calendar_date', name: 'Calendar Date', fieldName: 'calendar_date'}
      }
    }
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
  });
});
