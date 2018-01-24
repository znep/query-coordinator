import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import ParseOption from 'datasetManagementUI/components/ParseOptions/ParseOption';
import entities from 'data/entities';
import * as Selectors from 'datasetManagementUI/selectors';

describe('components/ParseOption', () => {
  const defaultProps = () => ({
    placeholder: 'foo',
    name: 'header_count',
    setOption: sinon.spy(),
    getOption: sinon.spy(),
    error: null
  });

  it('renders', () => {
    const component = shallow(<ParseOption {...defaultProps()} />);
    assert.isTrue(component.find('TextInput').exists());
  });

  it('displays an error when there is one', () => {
    const props = {
      ...defaultProps(),
      error: {
        message: 'Something bad happened'
      }
    }
    const component = shallow(<ParseOption {...props} />);
    assert.equal(
      component.find('.optionError').text(),
      'Something bad happened'
    )
  });
});
