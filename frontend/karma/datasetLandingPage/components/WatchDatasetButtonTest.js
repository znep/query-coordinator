import sinon from 'sinon';
import { assert } from 'chai';
import { WatchDatasetButton } from 'components/WatchDatasetButton/WatchDatasetButton';
import subscriptionStore from 'store/subscriptionStore'
window.I18n = require('mockTranslations');

describe('WatchDatasetButton', () => {

  function getProps(view, props) {
    return {
      view: view,
      ...props
    };
  }

  it('renders', () => {
    var spy = sinon.spy();
    var element = renderComponent(WatchDatasetButton, getProps({ subscribed: true}, { onSubscriptionChange: spy}));
    assert.isDefined(element);
    assert.match(element.className, /watch-dataset-button/);
  });

  describe('On Click', () => {
    it('should subscribe if not already subscribed', () => {
      var spy = sinon.spy();
      var subscribe = sinon.stub(subscriptionStore, 'subscribe').callsFake(_.constant(Promise.resolve({ status: 200 })));
      var element = renderComponent(WatchDatasetButton, getProps({ subscribed: false}, { onSubscriptionChange: spy}));

      TestUtils.Simulate.click(element.querySelector('label'));

      assert.ok(element.querySelector('.socrata-icon-watch'));
      sinon.assert.calledOnce(subscribe);
      return subscribe({ id: 102 }).then(() => {
        sinon.assert.calledOnce(spy);
        subscribe.restore();
      });
    });

    it('should unsubscribe if already subscribed', () => {
      var spy = sinon.spy();
      var unsubscribe = sinon.stub(subscriptionStore, 'unsubscribe').callsFake(_.constant(Promise.resolve({ status: 200 })));
      var element = renderComponent(WatchDatasetButton, getProps({ subscribed: true }, { onSubscriptionChange: spy }));

      TestUtils.Simulate.click(element.querySelector('label'));

      assert.ok(element.querySelector('.socrata-icon-watched'));
      sinon.assert.calledOnce(unsubscribe);
      return unsubscribe({ id: 102 }).then(() => {
        sinon.assert.calledOnce(spy);
        unsubscribe.restore();
      });
    });
  });

});
