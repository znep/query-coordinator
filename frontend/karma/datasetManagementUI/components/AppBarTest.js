import { expect, assert } from 'chai';
import React from 'react';
import { AppBar } from 'components/AppBar';
import { shallow } from 'enzyme';

describe('components/AppBar', () => {
  const defaultProps = {
    name: 'testing',
    showPreviewLink: true
  };

  const component = shallow(<AppBar {...defaultProps} />);

  it('renders without errors', () => {
    assert.isFalse(component.isEmpty());
  });

  it('renders a link to primer', () => {
    assert.equal(component.find('a').childAt(0).text(), 'Preview Primer');
  });
});
