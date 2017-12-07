import renderLocalizationElement from '../renderLocalizationComponent';

import ProductNotificationList from 'common/notifications/components/ProductNotificationList/ProductNotificationList';

describe('Product Notification List', () => {
  const defaultProps = {
    areNotificationsLoading: false,
    hasError: false,
    notifications: [],
    viewOlderLink: ''
  };

  it('should render', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(ProductNotificationList, defaultProps);

    assert.isNotNull(element);
  });

  it('should render product notifications panel header', () => {
    const element = renderLocalizationElement(ProductNotificationList, {
      ...defaultProps,
      showProductNotificationsAsSecondaryPanel: true
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.secondary-panel'));
  });

  it('should show error message if product notifications are not loaded due to an error', () => {
    const element = renderLocalizationElement(ProductNotificationList, {
      ...defaultProps,
      showProductNotificationsAsSecondaryPanel: true,
      hasError: true,
      isSecondaryPanelOpen: true
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.notifications-error-message-wrapper'));
  });

  it('should show no messages when product notifications are empty', () => {
    const element = renderLocalizationElement(ProductNotificationList, {
      ...defaultProps,
      showProductNotificationsAsSecondaryPanel: true,
      isSecondaryPanelOpen: true
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.no-notifications-message-wrapper'));
  });

  it('should render view older notifications link if "View Older Link" exist', () => {
    const element = renderLocalizationElement(ProductNotificationList, {
      ...defaultProps,
      showProductNotificationsAsSecondaryPanel: true,
      isSecondaryPanelOpen: true,
      viewOlderLink: '/older-stuff'
    });

    const viewOlderLink = element.querySelector('.view-older a');
    assert.isNotNull(viewOlderLink);
    assert.include(viewOlderLink.getAttribute('href'), 'older-stuff');
  });
});
