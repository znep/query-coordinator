import $ from 'jquery';
import React from 'react';
import { FlannelContent } from 'components/Flannel';
import { renderPureComponent } from '../../helpers';

describe('FlannelContent', () => {
  let element;

  beforeEach(() => {
    element = renderPureComponent(FlannelContent({ // eslint-disable-line new-cap
      children: [
        React.createElement('div', {
          className: 'test-element',
          key: 'child'
        })
      ]
    }));
  });

  it('renders', () => {
    assert.isNotNull(element);
    assert.isTrue($(element).hasClass('socrata-flannel-content'));
  });

  it('renders children elements', () => {
    assert.isNotNull(element.querySelector('.test-element'));
  });
});
