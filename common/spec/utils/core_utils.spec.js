import { assert } from 'chai';
import * as coreUtils from 'common/core/utils';

describe('core/utils', () => {
  describe('fetchApprovalsForResource', () => {

    it('makes a request with the appropriate resourceId', () => {

    });

    xit('throws an error if an invalid uid is passed', () => {
      assert.throws(() => coreUtils.fetchApprovalsForResource(''), / is not a valid uid/);
      assert.throws(() => coreUtils.fetchApprovalsForResource('bad-4x4'), /bad-4x4 is not a valid uid/);
      assert.throws(() => coreUtils.fetchApprovalsForResource('abcd-12345'), /abcd-12345 is not a valid uid/);
      assert.doesNotThrow(() => coreUtils.fetchApprovalsForResource('abcd-1234'));
    });
  });

  describe('setApprovalForResource', () => {
    it('makes a request with the appropriate resourceId and recordId', () => {

    });

    it('makes a request with the redoStateOnRecord method for non-pending assets', () => {

    });

    xit('throws an error if an invalid uid is passed', () => {
      assert.throws(() => coreUtils.setApprovalForResource({ resourceId: '', recordId: 5, body: {} }),
        / is not a valid uid/);
      assert.doesNotThrow(() => coreUtils.setApprovalForResource({ resourceId: 'abcd-1234', recordId: 5, body: {} }));
    });

    xit('throws an error if an invalid recordId is passed', () => {
      assert.throws(() => coreUtils.setApprovalForResource({ resourceId: 'abcd-1234', recordId: null, body: {} }),
        /null is not a valid record id/);
      assert.throws(() => coreUtils.setApprovalForResource({ resourceId: 'abcd-1234', recordId: 'foo', body: {} }),
        /foo is not a valid record id/);
    });

    xit('throws an error if an invalid body is passed', () => {
      assert.throws(() => coreUtils.setApprovalForResource({ resourceId: 'abcd-1234', recordId: 5, body: null }),
        /Invalid body for setting approval status/);
      assert.throws(() => coreUtils.setApprovalForResource({ resourceId: 'abcd-1234', recordId: 5, body: 7 }),
        /Invalid body for setting approval status/);
      assert.doesNotThrow(() => coreUtils.setApprovalForResource({ resourceId: 'abcd-1234', recordId: 5, body: {} }));
      assert.doesNotThrow(() => coreUtils.setApprovalForResource({ resourceId: 'abcd-1234', recordId: 5, body: { foo: 'bar' } }));
    });

  });
});
