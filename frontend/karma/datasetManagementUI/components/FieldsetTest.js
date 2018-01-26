import { assert } from 'chai';
import Fieldset from 'datasetManagementUI/components/Fieldset/Fieldset';
import TestUtils from 'react-dom/test-utils';
import React from 'react';
import { shallow } from 'enzyme';

describe('components/Fieldset', () => {
  const defaultProps = {
    title: 'Big Title',
    subtitle: 'Hey a subtitle!'
  };

  const child = <span id="child">Child</span>;

  const component = shallow(<Fieldset {...defaultProps} />);

  it('renders a title', () => {
    assert.isAtLeast(component.find('.dsmp-tab-title').length, 1);
  });

  it('renders a subtitle', () => {
    assert.isAtLeast(component.find('.dsmp-tab-subtitle').length, 1);
  });

  it('renders any elements it wraps (children)', () => {
    const component = shallow(
      <Fieldset {...defaultProps}>
        {child}
      </Fieldset>
    );
    assert.isTrue(component.find('#child').equals(child));
  });
});
