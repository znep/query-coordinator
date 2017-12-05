import renderLocalizationElement from '../renderLocalizationComponent';
import ProductNotification from 'common/notifications/components/ProductNotificationList/ProductNotification';

describe('Product Notification', () => {
  const defaultProps = {
    dateTime: 1484888755016,
    body: 'moo',
    id: 'moooooo',
    title: 'cows'
  };

  it('should render notification item', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(ProductNotification, defaultProps);

    assert.isNotNull(element);
  });

  it('should show notification title, body, and timestamp', () => {
    const element = renderLocalizationElement(ProductNotification, {
      ...defaultProps,
      body: 'test-body',
      title: 'test-title',
      dateTime: 1484888755016
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.notification-body'));
    assert.isNotNull(element.querySelector('.notification-timestamp'));
    assert.isNotNull(element.querySelector('.notification-title'));
  });
});
