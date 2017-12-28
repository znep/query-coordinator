import React from 'react';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { PointMapOptionsSelector } from 'common/authoring_workflow/components/PointMapOptionsSelector';

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

describe('PointMapOptionsSelector', function() {
  describe('rendering', function() {
    var component;

    describe('without data', function() {
      beforeEach(function() {
        component = renderComponent(PointMapOptionsSelector, defaultProps());
      });

      it('does not render a dropdown', function() {
        expect(component).to.be.null;
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        component = renderComponent(PointMapOptionsSelector, defaultProps({
          vifAuthoring: validVifAuthoring
        }));
      });

      it('renders resize points by value selection', function() {
        expect(component.querySelector('#resize-points-by-value-selection')).to.exist;
      });

      it('renders color by value selection', function() {
        expect(component.querySelector('#color-points-by-value-selection')).to.exist;
      });
    });
  });

  describe('events', function() {
    var props;
    var component;
    var overrides;

    var emitsPicklistEvent = function(selector, eventName) {
      it(`should emit an ${eventName} event.`, function() {
        var option = component.querySelector(`${selector}`);
        TestUtils.Simulate.click(option);
        sinon.assert.calledOnce(props[eventName]);
      });
    };

    beforeEach(function() {
      overrides = {
        metadata: metadata,
        vifAuthoring: validVifAuthoring,
        onResizePointsByValueSelection: sinon.stub(),
        onColorPointsByValueSelection: sinon.stub()
      };
      props = defaultProps(overrides);
      component = renderComponent(PointMapOptionsSelector, props);
    });

    describe('when selecting a resize points by value column', function() {
      emitsPicklistEvent('#resize-points-by-value-selection .picklist-option:nth-child(2)', 'onResizePointsByValueSelection');
    });

    describe('when selecting a color by value column', function() {
      emitsPicklistEvent('#color-points-by-value-selection .picklist-option:nth-child(5)', 'onColorPointsByValueSelection');
    });
  });
});
