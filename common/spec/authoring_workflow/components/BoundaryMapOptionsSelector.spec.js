import React from 'react';
import { shallow } from 'enzyme';

import defaultProps from '../defaultProps';
import { BoundaryMapOptionsSelector } from 'common/authoring_workflow/components/BoundaryMapOptionsSelector';

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
              columnName: 'polygon'
            }
          },
          mapOptions: {
            mapType: 'boundaryMap'
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

describe('BoundaryMapOptionsSelector', function() {
  describe('rendering', function() {
    let component;

    describe('without data', function() {
      beforeEach(function() {
        component = shallow(<BoundaryMapOptionsSelector {...defaultProps()} />);
      });

      it('does not render a dropdown', function() {
        expect(component.find('#color-boundaries-by-column-dropdown')).to.have.length(0);
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        const overrides = { vifAuthoring: validVifAuthoring };

        component = shallow(<BoundaryMapOptionsSelector {...defaultProps(overrides)} />);
      });

      it('renders color by value selection with dropdown options', function() {
        expect(component.find('#color-boundaries-by-column-dropdown')).to.have.length(1);
      });
    });
  });
});
