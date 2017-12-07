import { assert } from 'chai';
import { put, call } from 'redux-saga/effects';
import sinon from 'sinon';

import * as coreUtils from 'common/core/utils';

import {
  fetchApprovalForResource,
  setApprovalForResource
} from 'common/components/AssetBrowser/sagas/approvals';
import * as assetActions from 'common/components/AssetBrowser/actions/asset_actions';
import mockResourceApprovalPendingResponse from '../data/mock_resource_approval_pending_response';
import mockApproval from '../data/mock_approval';

const mockPendingResource = () =>
  mockResourceApprovalPendingResponse.details.filter((record) => record.state === 'pending')[0];

describe('ApprovalsSagas', () => {
  let consoleSpy;

  beforeEach(() => {
    // Can't figure out how to stub this with sinon. Seems not to care at all a just logs anyway.
    // See platform-ui/common/components/AssetBrowser/sagas/approvals.js:48
    consoleSpy = sinon.spy(console, 'error');
  });

  afterEach(() => consoleSpy.restore());

  describe('fetchApprovalForResource', () => {
    it('fetches the applicable approval for a given resource', () => {
      const testUid = 'test-uuid';
      const gen = fetchApprovalForResource(testUid);

      assert.deepEqual(
        gen.next().value,
        call(coreUtils.fetchApprovalsForResource, testUid)
      );

      assert.deepEqual(
        gen.next(mockResourceApprovalPendingResponse).value,
        mockPendingResource()
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });
  });

  describe('setApprovalForResource', () => {
    it('sets the approval state for a given resource', () => {
      const name = 'Some Test Resource';
      const notes = 'I approve this!';
      const resourceId = 'test-uuid';
      const recordId = 1;
      const state = 'approved';
      const resource = { name, notes, resourceId, state };
      const approval = mockApproval;
      const gen = setApprovalForResource(resource);

      assert.deepEqual(
        gen.next().value,
        call(fetchApprovalForResource, resourceId)
      );

      assert.deepEqual(
        gen.next(mockPendingResource()).value,
        call(coreUtils.setApprovalForResource, { approval, resource })
      );

      const alertTitle = `${name} has been approved.`;
      const alertBody = 'This may take a few moments to take effect.';

      assert.deepEqual(
        gen.next().value,
        put(assetActions.showAlert(alertTitle, alertBody))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });

    describe('when an exception is thrown', () => {
      xit('shows an error alert in the event of an error', () => {
        const name = 'Some Test Resource';
        const notes = 'I approve this!';
        const resourceId = 'test-uuid';
        const state = 'approved';
        const resource = { name, notes, resourceId, state };
        const gen = setApprovalForResource(resource);

        assert.deepEqual(
          gen.next().value,
          call(fetchApprovalForResource, resourceId)
        );

        const errorResponse = mockPendingResource();
        errorResponse.id = null;

        const errorTitle = `Error approving ${name}.`;
        const errorBody = 'Please try again and contact support@socrata.com if the problem persists.';

        assert.deepEqual(
          gen.next(errorResponse).value,
          put(assetActions.showAlert(errorTitle, errorBody))
        );

        assert.deepEqual(
          gen.next(),
          { done: true, value: undefined }
        );
      });
    });
  });
});
