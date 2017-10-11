import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import { AlertWrapper } from 'common/components/AssetBrowser/components/alert_wrapper';
import { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'common/i18n/config/locales/en.yml';

const alertWrapperProps = (props = {}) => ({
  alert: {
    bodyLocaleKey: 'shared.asset_browser.alert_messages.visibility_changed.body',
    time: 100,
    titleLocaleKey: 'shared.asset_browser.alert_messages.visibility_changed.title_public'
  },
  hideAlert: () => {},
  ...props
});

describe('components/AlertWrapper', () => {
  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
  });

  it('does not render an alert if the alert prop is null', () => {
    const wrapper = shallow(<AlertWrapper {...alertWrapperProps({
      alert: null
    })} />);
    assert.isFalse(wrapper.find('.alert').exists());
  });

  it('does not render an alert if the alert prop is an empty object', () => {
    const wrapper = shallow(<AlertWrapper {...alertWrapperProps({
      alert: {}
    })} />);
    assert.isFalse(wrapper.find('.alert').exists());
  });

  it('does render an alert if the alert prop has properties', () => {
    const wrapper = shallow(<AlertWrapper {...alertWrapperProps()} />);
    assert.isTrue(wrapper.find('.alert').exists());
    assert.isTrue(wrapper.hasClass('alert-wrapper'));
  });

  it('renders the correct alert text for the given locale keys', () => {
    const wrapper = shallow(<AlertWrapper {...alertWrapperProps()} />);
    assert.equal(wrapper.text(), 'Visibility changed to public. This may take a few moments to take effect.<SocrataIcon />');
  });
});
