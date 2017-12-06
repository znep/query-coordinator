import TestUtils from 'react-dom/test-utils';
import renderLocalizationElement from '../../renderLocalizationComponent';
import NotificationSettings from 'common/notifications/components/AlertSettingModal/NotificationSettings';

describe('NotificationSettings', () => {

  it('renders an element', () => {
    const element = renderLocalizationElement(NotificationSettings, { inProductTransientNotificationsEnabled: true });
    assert.isNotNull(element);
  });

  describe('In Product Transient ', () => {

    it('should renders in-product-transient switch', () => {
      const element = renderLocalizationElement(NotificationSettings, { inProductTransientNotificationsEnabled: true });
      assert.isNotNull(element.querySelector('.in-product-transient'));
    });

    it('should not renders in-product-transient switch if product transient feature flag is false', () => {
      const element = renderLocalizationElement(NotificationSettings, { inProductTransientNotificationsEnabled: false });
      assert.isNull(element.querySelector('.in-product-transient'));
    });

    it('should update settings when in-product-transient switch changes', () => {
      var onSettingsChange = sinon.spy();
      const element = renderLocalizationElement(NotificationSettings, {
        onSettingsChange: onSettingsChange,
        inProductTransientNotificationsEnabled: true
      });
      var emailSubscribtionButton = element.querySelector('.in-product-transient input');
      TestUtils.Simulate.change(emailSubscribtionButton);
      sinon.assert.calledOnce(onSettingsChange);
    });

  });
});
