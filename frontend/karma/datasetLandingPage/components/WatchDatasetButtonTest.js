import sinon from 'sinon';
import { assert } from 'chai';
import { WatchDatasetButton } from 'datasetLandingPage/components/WatchDatasetButton/WatchDatasetButton';
import subscriptionStore from 'datasetLandingPage/store/subscriptionStore'
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

  it('uses data asset strings when useDataAssetStrings is true', () => {
    var spy = sinon.spy();
    var element = renderComponent(WatchDatasetButton, getProps(
      { subscribed: true}, { onSubscriptionChange: spy, useDataAssetStrings: true}
    ));
    assert.isDefined(element);
    const unwatchSpan = element.querySelector('.checkbox-with-icon-label');

    assert.match(element.className, /watch-dataset-button/);
    assert.equal(unwatchSpan.textContent, 'Unwatch this Data Asset')

    var unsubscribedElement = renderComponent(WatchDatasetButton, getProps(
      { subscribed: false}, { onSubscriptionChange: spy, useDataAssetStrings: true}
    ));
    assert.isDefined(unsubscribedElement);
    const watchSpan = unsubscribedElement.querySelector('.checkbox-with-icon-label');

    assert.match(unsubscribedElement.className, /watch-dataset-button/);
    assert.equal(watchSpan.textContent, 'Watch this Data Asset')
  });

  it('uses dataset strings when useDataAssetStrings is not set', () => {
    var spy = sinon.spy();
    var element = renderComponent(WatchDatasetButton, getProps(
      { subscribed: true}, { onSubscriptionChange: spy}
    ));
    assert.isDefined(element);
    const unwatchSpan = element.querySelector('.checkbox-with-icon-label');

    assert.match(element.className, /watch-dataset-button/);
    assert.equal(unwatchSpan.textContent, 'Unwatch this Dataset')

    var unsubscribedElement = renderComponent(WatchDatasetButton, getProps(
      { subscribed: false}, { onSubscriptionChange: spy}
    ));
    assert.isDefined(unsubscribedElement);
    const watchSpan = unsubscribedElement.querySelector('.checkbox-with-icon-label');

    assert.match(unsubscribedElement.className, /watch-dataset-button/);
    assert.equal(watchSpan.textContent, 'Watch this Dataset')
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
