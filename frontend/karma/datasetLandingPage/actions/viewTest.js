import { assert } from 'chai';
import sinon from 'sinon';

import { mockResponse } from 'httpHelpers';
import * as http from 'common/http';
import {
  publishView,
  fetchRowCount,
  checkSubscription,
  // NOTE: non-thunk actions (below) are tested via the corresponding reducer test
  requestedViewPublish,
  handleViewPublishSuccess,
  handleViewPublishError,
  handleFetchRowCountSuccess,
  handleFetchRowCountError,
  checkSubscriptionOnLoad,
  handleCheckSubscriptionOnLoadError
} from 'datasetLandingPage/actions/view';

describe('actions/view', () => {
  let dispatchSpy;
  const getState = _.constant({ view: { id: 'four-four' } })

  beforeEach(() => {
    dispatchSpy = sinon.spy();
    sinon.stub(window, 'fetch');
  });

  afterEach(() => {
    window.fetch.restore();
  });

  describe('publishView', () => {
    describe('on success', () => {
      it('dispatches before a fetch, then dispatches on success and redirects', (done) => {
        window.fetch.returns(Promise.resolve(
          mockResponse({ id: "test-test" }, 200)
        ));

        const mock = sinon.mock(http).expects('redirectTo').once();

        publishView()(dispatchSpy, getState);
        sinon.assert.calledWith(dispatchSpy, requestedViewPublish());
        _.defer(() => {
          sinon.assert.calledWith(dispatchSpy, handleViewPublishSuccess());
          mock.verify();
          http.redirectTo.restore();
          done();
        });
      });
    });

    describe('on failure', () => {
      it('dispatches before a fetch, then dispatches on error', (done) => {
        window.fetch.returns(Promise.resolve(
          mockResponse(null, 500)
        ));

        publishView()(dispatchSpy, getState);
        sinon.assert.calledWith(dispatchSpy, requestedViewPublish());
        _.defer(() => {
          sinon.assert.calledWith(dispatchSpy, handleViewPublishError());
          done();
        });
      });
    });
  });

  describe('fetchRowCount', () => {
    describe('on success', () => {
      it('dispatches a numeric row count with results from NBE', (done) => {
        window.fetch.returns(Promise.resolve(
          mockResponse([{ COLUMN_ALIAS_GUARD__count: "52" }], 200)
        ));

        fetchRowCount()(dispatchSpy, getState);
        _.defer(() => {
          sinon.assert.calledWith(dispatchSpy, handleFetchRowCountSuccess(52));
          done();
        });
      });

      it('dispatches a numeric row count with results from OBE', (done) => {
        window.fetch.returns(Promise.resolve(
          mockResponse([{ column_alias_guard__count: "52" }], 200)
        ));

        fetchRowCount()(dispatchSpy, getState);
        _.defer(() => {
          sinon.assert.calledWith(dispatchSpy, handleFetchRowCountSuccess(52));
          done();
        });
      });
    });

    describe('on failure', () => {
      it('dispatches a null row count when an invalid success response is given', (done) => {
        window.fetch.returns(Promise.resolve(
          mockResponse({ response: "invalid" }, 200)
        ));

        fetchRowCount()(dispatchSpy, getState);
        _.defer(() => {
          sinon.assert.calledWith(dispatchSpy, handleFetchRowCountSuccess(null));
          done();
        });
      });

      it('dispatches on error', (done) => {
        window.fetch.returns(Promise.resolve(
          mockResponse(null, 500)
        ));

        fetchRowCount()(dispatchSpy, getState);
        _.defer(() => {
          sinon.assert.calledWith(dispatchSpy, handleFetchRowCountError());
          done();
        });
      });
    });
  });

  describe('checkSubscription', () => {
    describe('on success', () => {
      it('dispatches subscribed id if user subscribed for notification', (done) => {
        window.fetch.returns(Promise.resolve(
          mockResponse({data: [{id: 123}]}, 200)
        ));

        checkSubscription()(dispatchSpy, getState);
        _.defer(() => {
          sinon.assert.calledWith(dispatchSpy, checkSubscriptionOnLoad(123));
          done();
        });
      });

      it('dispatches subscribed id as null if user not subscribed for notification', (done) => {
        window.fetch.returns(Promise.resolve(
          mockResponse({data: []}, 200)
        ));

        checkSubscription()(dispatchSpy, getState);
        _.defer(() => {
          sinon.assert.calledWith(dispatchSpy, checkSubscriptionOnLoad(null));
          done();
        });
      });
    });

    describe('on failure', () => {
      it('dispatches handleCheckSubscriptionOnLoadError', (done) => {
        window.fetch.returns(Promise.resolve(
          mockResponse({}, 500)
        ));

        checkSubscription()(dispatchSpy, getState);
        _.defer(() => {
          sinon.assert.calledWith(dispatchSpy, handleCheckSubscriptionOnLoadError());
          done();
        });
      });
    });
  });
});
