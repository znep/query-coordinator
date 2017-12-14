import _ from 'lodash';
import { assert } from 'chai';
import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';

import DatePicker from 'components/DatePicker';

describe('DatePicker', () => {
  const getProps = (props) => ({
    onChangeDate: _.noop,
    date: '2001-02-03',
    ...props
  });

  const getInput = (element) => element.find('.date-picker-input').first();

  it('renders', () => {
    const element = shallow(<DatePicker {...getProps()} />);
    assert.ok(element);
  });

  it('accepts "date" in YYYY-MM-DD format', () => {
    const props = { date: '2001-05-06' };
    const element = mount(<DatePicker {...getProps(props)} />);

    const value = getInput(element).node.value;
    // Verify that the date displayed is correct.
    // Note that the format is different than what
    // we use in props, as this is just what the picker
    // displays. onChangeDate will still return values in YYYY-MM-DD format.
    assert.equal(value, '05/06/2001');
  });

  it('calls onChangeDate when the value changes', () => {
    const props = { onChangeDate: sinon.spy() };
    const element = mount(<DatePicker {...getProps(props)} />);

    const input = getInput(element);
    input.node.value = '05/06/2001';
    input.simulate('change');
    sinon.assert.calledOnce(props.onChangeDate);
    sinon.assert.calledWith(props.onChangeDate, '2001-05-06');
  });
});
