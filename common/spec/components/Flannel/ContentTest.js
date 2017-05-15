import React from 'react';
import { FlannelContent } from 'components/Flannel';
import { renderPureComponent } from '../../helpers';

describe('FlannelContent', () => {
  let element;

  beforeEach(() => {
    element = renderPureComponent(FlannelContent({
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
    expect(element).to.have.class('socrata-flannel-content');
  });

  it('renders children elements', () => {
    expect(element.querySelector('.test-element')).to.exist;
  });
});
