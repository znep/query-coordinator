import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { fetchResults } from 'actions/cetera';
import getState from 'reducers/catalog';
import ceteraUtils from 'common/cetera_utils';

import mockCeteraFetchResponse from '../../internalAssetManager/data/mock_cetera_fetch_response.js';

describe('cetera.js', () => {
  let ceteraStub;

  beforeEach(() => {
    ceteraStub = sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(mockCeteraFetchResponse)));
  });

  afterEach(() => ceteraStub.restore());

  // fetchResults returns a promise
  describe('fetchResults', () => {
    let ceteraUtilsQuerySpy;

    beforeEach(() => ceteraUtilsQuerySpy = sinon.spy(ceteraUtils, 'query'));

    afterEach(() => ceteraUtilsQuerySpy.restore());

    describe('mixpanelContext', () => {

      // Returns a promise
      it('includes the mixpanelContext param for reporting metrics', () => {
        const dispatch = () => {};
        const onSuccess = () => {};
        const parameters = { action: 'TOGGLE_RECENTLY_VIEWED', pageNumber: 1, onlyRecentlyViewed: true };

        return fetchResults(dispatch, getState, parameters, onSuccess).then((response) => {
          const mixpanelContext = ceteraUtils.query.getCall(0).args[0].mixpanelContext;

          assert.equal(mixpanelContext.eventName, 'Filtered Assets to Only Recently Viewed');
          assert.equal(Object.keys(mixpanelContext.params).length, 2);
          assert(_.includes(Object.keys(mixpanelContext.params), 'pageNumber', 'onlyRecentlyViewed'));
          assert.equal(mixpanelContext.params.pageNumber, 1);
          assert(mixpanelContext.params.onlyRecentlyViewed);
        });
      });

    });

  });

});
