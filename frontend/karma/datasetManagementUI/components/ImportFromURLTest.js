import React from 'react';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import ImportFromURL from 'components/ImportFromURL/ImportFromURL';
import sinon from 'sinon';

describe('components/ImportFromURL', () => {
  const defaultProps = {
    createURLSource: () => {},
    params: {},
    onDismiss: _.noop,
    showError: _.noop
  };

  it('renders correctly', () => {
    const component = shallow(<ImportFromURL {...defaultProps} />);
    assert.isAtLeast(component.find('label').length, 1);
  });
});
