import _ from 'lodash';
import { mount } from 'enzyme';
import TestUtils from 'react-dom/test-utils';
import React, { Component } from 'react';

import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import Dropdown from 'common/components/Dropdown';
import GeocoderTypeahead from 'common/components/CreateAlertModal/components/GeocoderTypeahead';
import RadiusSlider from 'common/components/CreateAlertModal/components/RadiusSlider';
import SoqlSliceBuilderValueField from 'common/components/CreateAlertModal/components/SoqlBuilder/SoqlSliceBuilderValueField';


describe('SoqlSliceBuilderValueField', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      haveNbeView: false,
      mapboxAccessToken: 'random number',
      selectedColumn: { column_type: 'money' },
      slice: {},
      viewId: 'abcd-efgh',
      onValueChange: sinon.spy()
    });
  }

  it('renders an element', () => {
    const element = mount(<SoqlSliceBuilderValueField {...getProps()} />);
    assert.isDefined(element);
  });


  describe('Number column', () => {
    it('should render text input field for number column type', () => {
      const slice = { column: 'numberColumn', operator: '>', value: 'abc' };
      const props = getProps({ slice: slice });
      const element = mount(<SoqlSliceBuilderValueField {...props} />);

      assert.lengthOf(element.find('.value-field'), 1);
    });

    it('should not render value field if operator is not selected', () => {
      const slice = { column: 'numberColumn' };
      const props = getProps({ slice: slice });
      const element = mount(<SoqlSliceBuilderValueField {...props} />);

      assert.lengthOf(element.find('.value-field'), 0);
    });

    it('should call onValueChange on input change', () => {
      const onValueChange = sinon.spy();
      const slice = { column: 'numberColumn', aggregation: 'SUM', function_operator: '>' };
      const props = getProps({
        slice: slice,
        onValueChange: onValueChange
      });
      const element = mount(<SoqlSliceBuilderValueField {...props} />);

      element.find('input').simulate('change');

      sinon.assert.calledOnce(onValueChange);
    });

  });

  describe('Date column', () => {
    it('should render operator field and date range selector for date column type', () => {
      const slice = { column: 'dateColumn', operator: 'with in' };
      const selectedColumn = { column_type: 'date' };
      const props = getProps({ slice: slice, selectedColumn: selectedColumn });
      const element = mount(<SoqlSliceBuilderValueField {...props} />);

      assert.lengthOf(element.find('.date-range'), 1);
    });

    it('should not render date-range selector if operator is not selected', () => {
      const slice = { column: 'dateColumn' };
      const props = getProps({ slice: slice });
      const element = mount(<SoqlSliceBuilderValueField {...props} />);

      assert.lengthOf(element.find('.date-range'), 0);
    });
  });

  describe('Location column', () => {
    it('should render location input and radius slider for location column type', () => {
      const slice = {
        column: 'locationColumn',
        operator: 'with in',
        location: 'places-abe',
        radius: 5
      };
      const selectedColumn = { column_type: 'location' };
      const props = getProps({ slice: slice, selectedColumn: selectedColumn });
      const element = mount(<SoqlSliceBuilderValueField {...props} />);

      assert.lengthOf(element.find(GeocoderTypeahead), 1);
      assert.lengthOf(element.find(RadiusSlider), 1);
    });

    it('should not render radius slider if location is not selected', () => {
      const slice = {
        column: 'locationColumn',
        operator: 'with in'
      };
      const props = getProps({ slice: slice });
      const element = mount(<SoqlSliceBuilderValueField {...props} />);

      assert.lengthOf(element.find(RadiusSlider), 0);
    });
  });

  describe('Row Identifier column', () => {
    it('should render value field and operator for row identifier column type', () => {
      const slice = {
        column: 'rowIdentifier',
        operator: '=',
        value: 10
      };
      const props = getProps({ slice: slice });
      const element = mount(<SoqlSliceBuilderValueField {...props} />);

      assert.lengthOf(element.find('.value-field'), 1);
    });

    it('should not render value field if operator is not selected', () => {
      const slice = {
        column: 'rowIdentifier'
      };
      const props = getProps({ slice: slice });
      const element = mount(<SoqlSliceBuilderValueField {...props} />);

      assert.lengthOf(element.find('.value-field'), 0);
    });
  });

});
