import { assert } from 'chai';
import { shallow } from 'enzyme';
import I18nJS from 'i18n-js';
import thunk from 'redux-thunk';

import { AlertWrapper } from 'components/alert_wrapper';

const alertWrapperProps = (props = {}) => ({
  alert: {
    bodyLocaleKey: 'internal_asset_manager.alert_messages.visibility_changed.body',
    time: 100,
    titleLocaleKey: 'internal_asset_manager.alert_messages.visibility_changed.title_public'
  },
  hideAlert: () => {},
  I18n: I18nJS,
  ...props
});

describe('components/AlertWrapper', () => {
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
