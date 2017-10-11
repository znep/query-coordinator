import renderLocalizationElement from '../renderLocalizationComponent'

import ProductNotificationList from 'common/notifications/components/ProductNotificationList/ProductNotificationList';

describe('Product Notification List', () => {

  it('should render a list of product notifications', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(ProductNotificationList, {});

    assert.isNotNull(element);
  });

  it('should render product notifications panel header', () => {
    const element = renderLocalizationElement(ProductNotificationList, {
      showProductNotificationsAsSecondaryPanel: true
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.secondary-panel'));
  });

  it('should show error message if product notifications are not loaded due to an error', () => {
    const element = renderLocalizationElement(ProductNotificationList, {
      showProductNotificationsAsSecondaryPanel: true,
      hasError: true,
      isSecondaryPanelOpen: true
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.notifications-error-message-wrapper'));
  });

  it('should show no messages when product notifications are empty', () => {
    const element = renderLocalizationElement(ProductNotificationList, {
      showProductNotificationsAsSecondaryPanel: true,
      isSecondaryPanelOpen: true
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.no-notifications-message-wrapper'));
  });

  it('should render view older notifications link if "View Older Link" exist', () => {
    const element = renderLocalizationElement(ProductNotificationList, {
      showProductNotificationsAsSecondaryPanel: true,
      isSecondaryPanelOpen: true,
      viewOlderLink: true
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.view-older'));
  });
});
