import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import ParseFlag from 'datasetManagementUI/components/ParseOptions/ParseFlag';
import entities from 'data/entities';
import * as Selectors from 'datasetManagementUI/selectors';

describe('components/ParseFlag', () => {
  const defaultProps = () => ({
    name: 'a_thing',
    setOption: sinon.spy(),
    getOption: sinon.spy()
  });

  it('renders', () => {
    const component = shallow(<ParseFlag {...defaultProps()} />);
    assert.isTrue(component.find('CheckBox').exists());
  });
});
