import TestUtils from 'react-dom/test-utils';
import renderLocalizationElement from '../../renderLocalizationComponent';
import EmailSettings from 'common/notifications/components/AlertSettingModal/EmailSettings';

describe('EmailSettings', () => {

  it('renders an element', () => {
    const element = renderLocalizationElement(EmailSettings, {});
    assert.isNotNull(element);
  });

  describe('Email Subscription ', () => {

    it('should renders email subscription enable button', () => {
      const element = renderLocalizationElement(EmailSettings, {});
      assert.isNotNull(element.querySelector('.email-digest-option'));
    });

    it('should update settings when subscription setting changes', () => {
      var onSettingsChange = sinon.spy();
      const element = renderLocalizationElement(EmailSettings, { onSettingsChange: onSettingsChange });
      var emailSubscribtionButton = element.querySelector('.email-mute input');
      TestUtils.Simulate.change(emailSubscribtionButton);
      sinon.assert.calledOnce(onSettingsChange);
    });

  });

  describe('Email Mute', () => {

    it('should render Email Mute contents', () => {
      const element = renderLocalizationElement(EmailSettings, {});
      assert.isNotNull(element.querySelector('.email-mute'));
    });

    it('should update settigs when email mute value changes', () => {
      var onSettingsChange = sinon.spy();
      const element = renderLocalizationElement(EmailSettings, { onSettingsChange: onSettingsChange });
      var emailMuteButton = element.querySelector('.email-mute input');
      TestUtils.Simulate.change(emailMuteButton);
      sinon.assert.calledOnce(onSettingsChange);
    });

  });

});
