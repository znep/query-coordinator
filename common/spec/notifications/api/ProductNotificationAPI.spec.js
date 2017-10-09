import _ from 'lodash';

import { getProductNotifications, updateProductNotificationLastSeen } from 'common/notifications/api/ProductNotificationAPI';
import { mockResponse } from '../helpers';

let updateProductNotificationLastSeenStub;
let getProductNotifaicationsStub;

describe('ProductNotificationAPI', () => {
  describe('getProductNotifications', () => {
    beforeEach(() => {
      getProductNotifaicationsStub = sinon.stub(
        window,
        'fetch',
        _.constant(Promise.resolve(mockResponse([], 200)))
      );
    });

    afterEach(() => {
      getProductNotifaicationsStub.restore();
    });

    it('should hit get product notifications and hit callback', () => {
      getProductNotifications();

      sinon.assert.calledOnce(getProductNotifaicationsStub);
      assert.equal(window.fetch.args[0][0], '/notifications');
    });
  });

  describe('updateProductNotificationLastSeen', () => {
    beforeEach(() => {
      updateProductNotificationLastSeenStub = sinon.stub(
        window,
        'fetch',
        _.constant(Promise.resolve(mockResponse([], 200)))
      );
    });

    afterEach(() => {
      updateProductNotificationLastSeenStub.restore();
    });

    it('should hit notifications unsubscribe url', () => {
      updateProductNotificationLastSeen();

      const request = window.fetch.args[0][1];

      sinon.assert.calledWith(updateProductNotificationLastSeenStub, '/notifications/setLastNotificationSeenAt');
      assert.equal(request.method, 'POST');
    });
  });
});
