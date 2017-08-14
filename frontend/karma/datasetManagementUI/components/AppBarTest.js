import { expect, assert } from 'chai';
import React from 'react';
import AppBar from 'components/AppBar/AppBar';
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
    const linkContents = component.find('PreviewLink').dive().text();
    assert.isTrue(linkContents.indexOf('Preview Primer') > -1);
  });
});
