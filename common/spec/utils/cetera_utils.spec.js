import { assert } from 'chai';
import ceteraUtils from 'common/cetera/utils';

describe('cetera/utils', () => {
  describe('ceteraQueryString', () => {
    it('handles baseFilters as an array of values', () => {
      assert.equal(
        ceteraUtils.ceteraQueryString({ approvalStatus: ['approved', 'rejected'] }),
        'domains=localhost&limit=6&offset=0&order=relevance&search_context=localhost&approval_status[]=approved&approval_status[]=rejected'
      );
    });

    it('handles baseFilters as a single string value', () => {
      assert.equal(
        ceteraUtils.ceteraQueryString({ approvalStatus: 'pending' }),
        'domains=localhost&limit=6&offset=0&order=relevance&search_context=localhost&approval_status=pending'
      );
    });
  });
});
