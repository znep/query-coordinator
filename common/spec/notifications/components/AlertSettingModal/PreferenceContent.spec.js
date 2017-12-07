import TestUtils from 'react-dom/test-utils';
import renderLocalizationElement from '../../renderLocalizationComponent';
import PreferenceContent from 'common/notifications/components/AlertSettingModal/PreferenceContent';

describe('PreferenceContent', () => {
  const defaultProps = {
    preferences: {},
    settings: {}
  };

  it('renders an element', () => {
    const element = renderLocalizationElement(PreferenceContent, defaultProps);
    assert.isNotNull(element);
  });

  describe('All Assets', () => {

    it('should renders all assets contents', () => {
      const element = renderLocalizationElement(PreferenceContent, defaultProps);
      assert.isNotNull(element.querySelector('#notify-subscribe-all-assets'));
      assert.isNotNull(element.querySelector('#meta-data-change'));
      assert.isNotNull(element.querySelector('#data-change'));
      assert.isNotNull(element.querySelector('#permission-change'));
    });

    it('should update preference when subscription value changes', () => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent, {
        ...defaultProps,
        onAlertNotificationChange
      });
      var subscribeAllAsset = element.querySelector('#notify-subscribe-all-assets');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });

  });

  describe('UserAccounts', () => {

    it('should render UserAccounts contents', () => {
      const element = renderLocalizationElement(PreferenceContent, { ...defaultProps, isSuperAdmin: true });
      assert.isNotNull(element.querySelector('#notify-subscribe-user-accounts'));
    });

    it('should not render UserAccounts contents if user is not admin', () => {
      const element = renderLocalizationElement(PreferenceContent, { ...defaultProps, isSuperAdmin: false });
      assert.isNull(element.querySelector('#notify-subscribe-user-accounts'));
    });

    it('should update preference when subscription value changes', () => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent,
        { ...defaultProps, onAlertNotificationChange, isSuperAdmin: true });
      var subscribeAllAsset = element.querySelector('#notify-subscribe-user-accounts');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });

  });

  describe('Delete Assets', () => {

    it('should renders Delete Assets contents', () => {
      const element = renderLocalizationElement(PreferenceContent, defaultProps);
      assert.isNotNull(element.querySelector('#notify-subscribe-delete-assets'));
    });

    it('should update preference when subscription value changes', () => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent,
        { ...defaultProps, onAlertNotificationChange });
      var subscribeAllAsset = element.querySelector('#notify-subscribe-delete-assets');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });
  });

  describe('My Assets', () => {

    it('should renders Delete Assets contents', () => {
      const element = renderLocalizationElement(PreferenceContent, defaultProps);
      assert.isNotNull(element.querySelector('#notify-subscribe-my-assets'));
    });

    it('should update preference when subscription value changes', () => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent, { ...defaultProps, onAlertNotificationChange });
      var subscribeAllAsset = element.querySelector('#notify-subscribe-my-assets');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });
  });

  describe('Watch List', () => {

    it('should renders Delete Assets contents', () => {
      const element = renderLocalizationElement(PreferenceContent, defaultProps);
      assert.isNotNull(element.querySelector('#notify-subscribe-my-assets'));
    });

    it('should update preference when subscription value changes', () => {
      var onAlertNotificationChange = sinon.spy();
      const element = renderLocalizationElement(PreferenceContent,
        { ...defaultProps, onAlertNotificationChange });
      var subscribeAllAsset = element.querySelector('#notify-subscribe-my-assets');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });
  });

  describe('Routing & Approval', () => {

    it('should render Routing & Approval contents', () => {
      const props = {
        ...defaultProps,
        currentDomainFeatures: { routing_approval: true },
        isSuperAdmin: true
      };
      const element = renderLocalizationElement(PreferenceContent, props);
      assert.isNotNull(element.querySelector('#notify-subscribe-routing-approval'));
    });

    it('should not render Routing & Approval contents if user is not admin', () => {
      const props = {
        ...defaultProps,
        currentDomainFeatures: { routing_approval: true },
        isSuperAdmin: false
      };
      const element = renderLocalizationElement(PreferenceContent, props);
      assert.isNull(element.querySelector('#notify-subscribe-routing-approval'));
    });

    it('should not render Routing & Approval contents if routing_and_approval feature is disabled', () => {
      const props = {
        ...defaultProps,
        currentDomainFeatures: { routing_approval: false },
        isSuperAdmin: true
      };
      const element = renderLocalizationElement(PreferenceContent, props);
      assert.isNull(element.querySelector('#notify-subscribe-routing-approval'));
    });

    it('should update preference when subscription value changes', () => {
      var onAlertNotificationChange = sinon.spy();
      const props = {
        ...defaultProps,
        currentDomainFeatures: { routing_approval: true },
        isSuperAdmin: true,
        onAlertNotificationChange: onAlertNotificationChange
      };
      const element = renderLocalizationElement(PreferenceContent, props);
      var subscribeAllAsset = element.querySelector('#notify-subscribe-routing-approval');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });

  });

  describe('New Assets', () => {
    it('should not render new assets contents if user is not admin', () => {
      const props = {
        ...defaultProps,
        currentDomainFeatures: { routing_approval: false },
        isSuperAdmin: false
      };
      const element = renderLocalizationElement(PreferenceContent, props);
      assert.isNull(element.querySelector('#notify-subscribe-new-assets'));
    });

    it('should not render new assets content if routing_approval feature is enabled', () => {
      const props = {
        ...defaultProps,
        currentDomainFeatures: { routing_approval: true },
        isSuperAdmin: false
      };
      const element = renderLocalizationElement(PreferenceContent, props);
      assert.isNull(element.querySelector('#notify-subscribe-new-assets'));
    });

    it('should update preference when subscription value changes', () => {
      var onAlertNotificationChange = sinon.spy();
      const props = {
        ...defaultProps,
        currentDomainFeatures: { routing_approval: false },
        isSuperAdmin: true,
        onAlertNotificationChange: onAlertNotificationChange
      };
      const element = renderLocalizationElement(PreferenceContent, props);
      var subscribeAllAsset = element.querySelector('#notify-subscribe-new-assets');
      TestUtils.Simulate.change(subscribeAllAsset);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });

  });

  describe('My Alert', () => {
    it('should renders my alert contents', () => {
      const element = renderLocalizationElement(PreferenceContent, { showMyAlertPreference: true });
      assert.isNotNull(element.querySelector('#notify-subscribe-my-alert'));
    });

    it('should not renders my alert contents if showMyAlertPreference props is false', () => {
      const element = renderLocalizationElement(PreferenceContent, {});
      assert.isNull(element.querySelector('#notify-subscribe-my-alert'));
    });

    it('should update preference when subscription value changes', () => {
      var onAlertNotificationChange = sinon.spy();
      const props = {
        onAlertNotificationChange: onAlertNotificationChange,
        showMyAlertPreference: true
      };
      const element = renderLocalizationElement(PreferenceContent, props);
      var subscribeMyAlert = element.querySelector('#notify-subscribe-my-alert');
      TestUtils.Simulate.change(subscribeMyAlert);
      sinon.assert.calledOnce(onAlertNotificationChange);
    });
  });


});
