import _ from 'lodash';
import { mount } from 'enzyme';
import TestUtils from 'react-dom/test-utils';
import React, { Component } from 'react';

import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import Dropdown from 'common/components/Dropdown';
import GeocoderTypeahead from 'common/components/CreateAlertModal/components/GeocoderTypeahead';
import RadiusSlider from 'common/components/CreateAlertModal/components/RadiusSlider';
import SoqlSliceBuilder from 'common/components/CreateAlertModal/components/SoqlBuilder/SoqlSliceBuilder';

describe('SoqlSliceBuilder', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      slice: {},
      datasetColumns: [
        { title: 'textColumn', value: 'textColumn', column_type: 'text' },
        { title: 'numberColumn', value: 'numberColumn', column_type: 'money' },
        { title: 'dateColumn', value: 'dateColumn', column_type: 'date' },
        { title: 'rowIdentifier', value: 'rowIdentifier', column_type: 'row_identifier' },
        { title: 'locationColumn', value: 'locationColumn', column_type: 'location' }
      ],
      haveNbeView: false,
      viewId: 'abcd-efgh',
      mapboxAccessToken: 'random number'
    });
  }

  it('renders an element', () => {
    const element = mount(<SoqlSliceBuilder {...getProps()} />);

    assert.isDefined(element);
  });

  it('should render column selector field', () => {
    const element = mount(<SoqlSliceBuilder {...getProps()} />);

    assert.lengthOf(element.find('.dataset-column-selector'), 1);
  });

  it('should render logical operator field if alertIndex is greater than zero', () => {
    const props = getProps({ sliceIndex: 1 });
    const element = mount(<SoqlSliceBuilder {...props} />);

    assert.lengthOf(element.find('.logical-operator'), 1);
  });

  it('should render aggregator field if column is selected', () => {
    const slice = { column: 'textColumn', operator: '>', value: 'abc' };
    const props = getProps({ slice: slice });
    const element = mount(<SoqlSliceBuilder {...props} />);

    assert.lengthOf(element.find('.aggregation-selector'), 1);
  });

  it('should render functional operator field if aggregation value is selected for number column', () => {
    const slice = { column: 'numberColumn', aggregation: 'SUM', function_operator: '>' };
    const props = getProps({ slice: slice });
    const element = mount(<SoqlSliceBuilder {...props} />);

    assert.lengthOf(element.find('.aggregation-selector'), 1);
    assert.lengthOf(element.find('.function-operator-field'), 1);
  });


  describe('Delete Slice', () => {
    it('should render delete icon if slice index is greater than zero', () => {
      const props = getProps({ sliceIndex: 1 });
      const element = mount(<SoqlSliceBuilder {...props} />);

      assert.lengthOf(element.find('.icon-close'), 1);
    });

    it('should not render delete icon if slice index is less than one', () => {
      const props = getProps({ sliceIndex: 0 });
      const element = mount(<SoqlSliceBuilder {...props} />);

      assert.lengthOf(element.find('.icon-close'), 0);
    });

    it('should call removeSliceEntry on delete icon click', () => {
      const removeSliceEntrySpy = sinon.spy();
      const props = getProps({
        sliceIndex: 1,
        removeSliceEntry: removeSliceEntrySpy
      });
      const element = mount(<SoqlSliceBuilder {...props} />);

      element.find('.icon-close').simulate('click');

      sinon.assert.calledOnce(removeSliceEntrySpy);
    });
  });
});
