import { assert } from 'chai';
import React from 'react';
import NoMatch from 'components/NoMatch';
import { shallow } from 'enzyme';

describe('components/NoMatch', () => {
  it('renders without errors', () => {
    const element = shallow(<NoMatch />);
    assert.isFalse(element.isEmpty());
  });
});
