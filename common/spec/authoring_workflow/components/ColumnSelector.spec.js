import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import renderComponent from '../renderComponent';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../defaultProps';
import { ColumnSelector } from 'common/authoring_workflow/components/ColumnSelector';

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
            mapType: 'pointMap',
            'additionalFlyoutColumns': ['column_one', 'column_two', 'column_three', 'column_four']
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

describe('ColumnSelector', function() {
  describe('rendering', function() {
    let component;

    describe('without data', function() {
      beforeEach(function() {
        const overrides = {
          metadata: { data: null },
          listItemKeyPrefix: 'AdditionalFlyoutValues'
        };

        component = shallow(<ColumnSelector {...defaultProps(overrides)} />);
      });

      it('does not render a additional flyout column selector options', function() {
        assert.isFalse(component.find('#column-selectors-container').exists());
      });
    });

    describe('with data', function() {
      beforeEach(function() {
        const overrides = {
          vifAuthoring: validVifAuthoring,
          listItemKeyPrefix: 'AdditionalFlyoutValues'
        };

        component = shallow(<ColumnSelector {...defaultProps(overrides)} />);
      });

      it('renders additional flyout column selector options', function() {
        assert.isTrue(component.find('#column-selectors-container').exists());
      });

      it('renders additional flyout column selector values with delete link', function() {
        assert.lengthOf(component.find('.list-item'), 4);
        assert.lengthOf(component.find('.list-item .delete-link'), 4);
      });

      it('renders add flyout link', function() {
        assert.isTrue(component.find('#column-add-flyout-link').exists());
      });
    });
  });

  describe('events', function() {
    let props;
    let component;
    const overrides = {
      metadata: metadata,
      vifAuthoring: validVifAuthoring,
      listItemKeyPrefix: 'AdditionalFlyoutValues',
      onAddColumnSelector: sinon.stub(),
      onRemoveColumnSelector: sinon.stub(),
      onChangeColumn: sinon.stub()
    };

    function emitsEvent(id, eventName) {
      it(`should emit an ${eventName} event`, function() {
        TestUtils.Simulate.click(component.querySelector(id));
        sinon.assert.calledOnce(props[eventName]);
      });
    }

    beforeEach(function() {
      props = defaultProps(overrides);
      component = renderComponent(ColumnSelector, props);
    });

    describe('when selecting a newly added flyout column dropdown', function() {
      it('should emit an onAddColumnSelector event.', function() {
        const addFlyoutLink = component.querySelector('#column-add-flyout-link');
        TestUtils.Simulate.click(addFlyoutLink);

        TestUtils.Simulate.click(component.querySelector('#column-selection-4 .picklist-option:nth-child(3)'));
        sinon.assert.calledOnce(props.onAddColumnSelector);
      });
    });

    describe('when changing the additional flyout column dropdown', function() {
      emitsEvent('#column-selection-0 .picklist-option:nth-child(2)', 'onChangeColumn');
    });

    describe('when clicked on delete link', function() {
      emitsEvent('#column-delete-link-3', 'onRemoveColumnSelector');
    });
  });
});
