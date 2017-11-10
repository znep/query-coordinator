import { assert } from 'chai';
import * as coreUtils from 'common/core/utils';

describe('core/utils', () => {
  describe('fetchApprovalsForResource', () => {
    it('throws an error if an invalid uid is passed', () => {
      assert.throws(() => coreUtils.fetchApprovalsForResource(''), / is not a valid uid/);
      assert.throws(() => coreUtils.fetchApprovalsForResource('bad-4x4'), /bad-4x4 is not a valid uid/);
      assert.throws(() => coreUtils.fetchApprovalsForResource('abcd-12345'), /abcd-12345 is not a valid uid/);
      assert.doesNotThrow(() => coreUtils.fetchApprovalsForResource('abcd-1234'));
    });
  });

  describe('setApprovalForPendingResource', () => {
    it('throws an error if an invalid uid is passed', () => {
      assert.throws(() => coreUtils.setApprovalForPendingResource({ resourceId: '', recordId: 5, body: {} }),
        / is not a valid uid/);
      assert.doesNotThrow(() => coreUtils.setApprovalForPendingResource({ resourceId: 'abcd-1234', recordId: 5, body: {} }));
    });

    it('throws an error if an invalid recordId is passed', () => {
      assert.throws(() => coreUtils.setApprovalForPendingResource({ resourceId: 'abcd-1234', recordId: null, body: {} }),
        /null is not a valid record id/);
      assert.throws(() => coreUtils.setApprovalForPendingResource({ resourceId: 'abcd-1234', recordId: 'foo', body: {} }),
        /foo is not a valid record id/);
    });

    it('throws an error if an invalid body is passed', () => {
      assert.throws(() => coreUtils.setApprovalForPendingResource({ resourceId: 'abcd-1234', recordId: 5, body: null }),
        /Invalid body for setting approval status/);
      assert.throws(() => coreUtils.setApprovalForPendingResource({ resourceId: 'abcd-1234', recordId: 5, body: 7 }),
        /Invalid body for setting approval status/);
      assert.doesNotThrow(() => coreUtils.setApprovalForPendingResource({ resourceId: 'abcd-1234', recordId: 5, body: {} }));
      assert.doesNotThrow(() => coreUtils.setApprovalForPendingResource({ resourceId: 'abcd-1234', recordId: 5, body: { foo: 'bar' } }));
    });

  });
});
