import $ from 'jquery';
import React from 'react';
import { FlannelFooter } from 'components/Flannel';
import { renderPureComponent } from '../../helpers';

describe('FlannelFooter', () => {
  let element;

  beforeEach(() => {
    element = renderPureComponent(FlannelFooter({ // eslint-disable-line new-cap
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
    assert.isTrue($(element).hasClass('socrata-flannel-actions'));
  });

  it('renders children elements', () => {
    assert.isNotNull(element.querySelector('.test-element'));
  });
});
