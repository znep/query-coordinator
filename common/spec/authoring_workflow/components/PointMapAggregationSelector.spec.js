import React from 'react';
import { shallow } from 'enzyme';

import defaultProps from '../defaultProps';
import { PointMapAggregationSelector } from 'common/authoring_workflow/components/PointMapAggregationSelector';

const validVifAuthoring = {
  authoring: {
    selectedVisualizationType: 'map'
  },
  vifs: {
    map: {
      series: [
        {
          dataSource: {
            dimension: {
              columnName: 'point'
            }
          },
          mapOptions: {
            mapType: 'pointMap'
          }
        }
      ]
    }
  }
};
const metadata = {
  domain: 'test.domain',
  datasetUid: 'xxxx-xxxx',
  data: {
    columns: [
      { name: 'Money', fieldName: 'money', renderTypeName: 'money' },
      { name: 'Number', fieldName: 'number', renderTypeName: 'number' },
      { name: 'Police Districts', fieldName: 'policeDistricts', renderTypeName: 'text' },
      { name: 'Percent', fieldName: 'percent', renderTypeName: 'percent' },
      { name: 'Neighborhoods', fieldName: 'neighborhoods', renderTypeName: 'text' },
      { name: 'Case ID', fieldName: 'caseId', renderTypeName: 'number' }
    ]
  }
};

describe('PointMapAggregationSelector', function() {
  describe('rendering', function() {
    let component;

    describe('without data', function() {
      beforeEach(function() {
        component = shallow(<PointMapAggregationSelector {...defaultProps()} />);
      });

      it('does not render point aggregation options', function() {
        expect(component.find('#point-aggregation-options')).to.have.length(0);
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        const overrides = { vifAuthoring: validVifAuthoring };

        component = shallow(<PointMapAggregationSelector {...defaultProps(overrides)} />);
      });

      it('renders point aggregation options', function() {
        expect(component.find('#point-aggregation-options')).to.have.length(1);
      });

      it('renders default point aggregation radio button', function() {
        expect(component.find('#none_point_aggregation')).to.have.length(1);
      });

      it('renders heat map point aggregation radio button', function() {
        expect(component.find('#heat_map_point_aggregation')).to.have.length(1);
      });

      it('renders region map point aggregation radio button', function() {
        expect(component.find('#region_map_point_aggregation')).to.have.length(1);
      });
    });
  });
});
