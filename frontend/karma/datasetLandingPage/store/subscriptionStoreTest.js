import sinon from 'sinon';
import { assert } from 'chai';
import _ from 'lodash';
import airbrake from 'common/airbrake';
import subscriptionStore from 'store/subscriptionStore';
import { mockResponse } from 'httpHelpers';

let subscribeStub = null;
let unsubscribeStub = null;

describe('subscriptionStore', () => {
  describe('subscriptionStore.subscribe', () => {

    describe('successful response', () => {
      beforeEach(() => {
        subscribeStub = sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
          mockResponse({data: [{id: 20}]}, 200)
        )));
      });

      afterEach(() => {
        subscribeStub.restore();
      });

      it('should hit notifications subscribe url as post method', () => {
        subscriptionStore.subscribe('subs-1234');
        sinon.assert.calledOnce(subscribeStub);
        const request = window.fetch.args[0][1];
        const requestParams = JSON.parse(request.body);
        assert.equal(
          window.fetch.args[0][0],
          '/api/notifications_and_alerts/subscriptions'
        );
        assert.equal(request.method, 'POST');
        assert.equal(requestParams.subscription.dataset, 'subs-1234');
        assert.equal(requestParams.subscription.activity, 'WATCH_DATASET');
      });
    });

    describe('unsuccessful response', () => {
      let airBrakeStub = null;
      let consoleErrorStub = null;

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        subscribeStub = sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
          mockResponse({data: [{id: 20}]}, 404, 'Not found')
        )))
      });

      afterEach(() => {
        subscribeStub.restore();
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        return subscriptionStore.subscribe('subs-1234').then(
          () => {
            throw new Error('Unexpected resolution')
          },
          (error) => {
            subscribeStub.restore();
            assert.equal(error.toString(), 'Error: Not found');
          }
        );
      });
    });
  });

  describe('subscriptionStore.unsubscribe', () => {
    describe('successful response', () => {
      beforeEach(() => {
        unsubscribeStub = sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
          mockResponse({data: []}, 200)
        )))
      });

      afterEach(() => {
        unsubscribeStub.restore();
      });

      it('should hit notifications unsubscribe url', () => {
        return subscriptionStore.unsubscribe('1234').then(() => {
          sinon.assert.calledWith(unsubscribeStub, '/api/notifications_and_alerts/subscriptions/1234');
        });
      });
    });

    describe('unsuccessful response', () => {
      let airBrakeStub = null;
      let consoleErrorStub = null;

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
        unsubscribeStub = sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(
          mockResponse({data: [{id: 20}]}, 404, 'Not found')
        )))
      });

      afterEach(() => {
        airBrakeStub.restore();
        consoleErrorStub.restore();
        unsubscribeStub.restore();
      });

      it('throws a connection error', () => {
        return subscriptionStore.unsubscribe('subs-1234').then(
          () => {
            throw new Error('Unexpected resolution')
          },
          (error) => {
            unsubscribeStub.restore();
            assert.equal(error.toString(), 'Error: Not found');
          }
        );
      });
    });
  });
});
