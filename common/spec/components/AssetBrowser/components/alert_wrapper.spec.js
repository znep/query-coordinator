import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import { AlertWrapper } from 'common/components/AssetBrowser/components/alert_wrapper';

const alertWrapperProps = (props = {}) => ({
  alert: {
    body: 'This may take a few moments to take effect.',
    time: 100,
    title: 'Visibility changed to public.'
  },
  hideAlert: () => {},
  ...props
});

describe('components/AlertWrapper', () => {
  it('does not render an alert if the alert prop is null', () => {
    const wrapper = shallow(<AlertWrapper
      {...alertWrapperProps({ alert: null })} />
    );
    assert.isFalse(wrapper.find('.alert').exists());
  });

  it('does not render an alert if the alert prop is an empty object', () => {
    const wrapper = shallow(<AlertWrapper
      {...alertWrapperProps({ alert: {} })} />
    );
    assert.isFalse(wrapper.find('.alert').exists());
  });

  it('does render an alert if the alert prop has properties', () => {
    const wrapper = shallow(<AlertWrapper {...alertWrapperProps()} />);
    assert.isTrue(wrapper.find('.alert').exists());
    assert.isTrue(wrapper.hasClass('alert-wrapper'));
  });

  it('renders the alert title and body', () => {
    const wrapper = shallow(<AlertWrapper {...alertWrapperProps()} />);
    assert.equal(wrapper.text(), 'Visibility changed to public. This may take a few moments to take effect.<SocrataIcon />');
  });
});
