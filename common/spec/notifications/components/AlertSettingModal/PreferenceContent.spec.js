import TestUtils from 'react-dom/test-utils';
import renderLocalizationElement from '../../renderLocalizationComponent';
import PreferenceContent from 'common/notifications/components/AlertSettingModal/PreferenceContent';

describe('PreferenceContent', () => {

  it('renders an element', () => {
    const element = renderLocalizationElement(PreferenceContent, {});
    assert.isNotNull(element);
  });

  describe('All Assets', () => {

    it('should renders all assets contents', () => {
      const element = renderLocalizationElement(PreferenceContent, {});
      assert.isNotNull(element.querySelector('#notify-subscribe-all-assets'));
      assert.isNotNull(element.querySelector('#meta-data-change'));
      assert.isNotNull(element.querySelector('#data-change'));
      assert.isNotNull(element.querySelector('#permission-change'));
    });

    it('should update preference when subscription value changes',() => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent, {onAlertNotificationChange: onAlertNotificationChange});
      var subscribeAllAsset = element.querySelector('#notify-subscribe-all-assets');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });

  });

  describe('UserAccounts', () => {

    it('should renders UserAccounts contents', () => {
      const element = renderLocalizationElement(PreferenceContent, {});
      assert.isNotNull(element.querySelector('#notify-subscribe-user-accounts'));
    });

    it('should update preference when subscription value changes',() => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent, {onAlertNotificationChange: onAlertNotificationChange});
      var subscribeAllAsset = element.querySelector('#notify-subscribe-user-accounts');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });

  });

  describe('Delete Assets', () => {

    it('should renders Delete Assets contents', () => {
      const element = renderLocalizationElement(PreferenceContent, {});
      assert.isNotNull(element.querySelector('#notify-subscribe-delete-assets'));
    });

    it('should update preference when subscription value changes',() => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent, {onAlertNotificationChange: onAlertNotificationChange});
      var subscribeAllAsset = element.querySelector('#notify-subscribe-delete-assets');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });
  });

  describe('My Assets', () => {

    it('should renders Delete Assets contents', () => {
      const element = renderLocalizationElement(PreferenceContent, {});
      assert.isNotNull(element.querySelector('#notify-subscribe-my-assets'));
    });

    it('should update preference when subscription value changes',() => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent, {onAlertNotificationChange: onAlertNotificationChange});
      var subscribeAllAsset = element.querySelector('#notify-subscribe-my-assets');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });
  });

  describe('Watch List', () => {

    it('should renders Delete Assets contents', () => {
      const element = renderLocalizationElement(PreferenceContent, {});
      assert.isNotNull(element.querySelector('#notify-subscribe-my-assets'));
    });

    it('should update preference when subscription value changes',() => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent, {onAlertNotificationChange: onAlertNotificationChange});
      var subscribeAllAsset = element.querySelector('#notify-subscribe-my-assets');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });
  });

});
