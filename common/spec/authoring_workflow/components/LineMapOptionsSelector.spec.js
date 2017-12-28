import React from 'react';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { LineMapOptionsSelector } from 'common/authoring_workflow/components/LineMapOptionsSelector';

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
              columnName: 'line'
            }
          },
          mapOptions: {
            mapType: 'lineMap'
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

describe('LineMapOptionsSelector', function() {
  describe('rendering', function() {
    var component;

    describe('without data', function() {
      beforeEach(function() {
        component = renderComponent(LineMapOptionsSelector, defaultProps());
      });

      it('does not render a dropdown', function() {
        expect(component).to.be.null;
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        component = renderComponent(LineMapOptionsSelector, defaultProps({
          vifAuthoring: validVifAuthoring
        }));
      });

      it('renders weigh lines by value selection', function() {
        expect(component.querySelector('#weigh-lines-by-value-selection')).to.exist;
      });

      it('renders color by value selection', function() {
        expect(component.querySelector('#color-lines-by-value-selection')).to.exist;
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
        onWeighLinesByValueSelection: sinon.stub(),
        onColorLinesByValueSelection: sinon.stub()
      };
      props = defaultProps(overrides);
      component = renderComponent(LineMapOptionsSelector, props);
    });

    describe('when selecting a weigh lines by value column', function() {
      emitsPicklistEvent('#weigh-lines-by-value-selection .picklist-option:nth-child(2)', 'onWeighLinesByValueSelection');
    });

    describe('when selecting a color by value column', function() {
      emitsPicklistEvent('#color-lines-by-value-selection .picklist-option:nth-child(5)', 'onColorLinesByValueSelection');
    });
  });
});
