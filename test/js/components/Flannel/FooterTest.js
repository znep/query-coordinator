import React from 'react';
import { FlannelFooter } from 'components/Flannel';
import { renderPureComponent } from '../../helpers';

describe('FlannelFooter', () => {
  let element;

  beforeEach(() => {
    element = renderPureComponent(FlannelFooter({
      children: [
        React.createElement('div', {
          className: 'test-element',
          key: 'child'
        })
      ]
    }));
  });

  it('renders', () => {
    expect(element).to.exist;
    expect(element).to.have.class('socrata-flannel-actions');
  });

  it('renders children elements', () => {
    expect(element.querySelector('.test-element')).to.exist;
  });
});
