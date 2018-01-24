import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { mockResponse } from 'httpHelpers';
import * as api from 'adminActivityFeedSoql/lib/api';
import mockData from '../data/mockFetchTable';

describe('lib/api', () => {

  describe('.fetchRowCount', () => {
    let fetchRowCountStub;
    const responseData = [{"COLUMN_ALIAS_GUARD__count":"3"}];

    beforeEach(() => {
      const response = _.constant(Promise.resolve(mockResponse(responseData, 200)));

      fetchRowCountStub = sinon.
        stub(window, 'fetch').
        callsFake(response);
    });

    afterEach(() => {
      fetchRowCountStub.restore();
    });

    it('should return row count', (done) => {
      const options = {
        filters: {
          activeTab: 'all'
        }
      };

      api.
        fetchRowCount(options).
        then((rowCount) => {
          sinon.assert.calledOnce(fetchRowCountStub);
          assert.equal(responseData[0]['COLUMN_ALIAS_GUARD__count'], rowCount);
          done();
        });
    });
  });

  describe('.fetchTable', () => {
    let fetchTableStub;

    beforeEach(() => {
      const response = _.constant(Promise.resolve(mockResponse(mockData, 200)));

      fetchTableStub = sinon.
        stub(window, 'fetch').
        callsFake(response);
    });

    afterEach(() => {
      fetchTableStub.restore();
    });

    it('should return events', (done) => {
      const options = {
        offset: 0,
        limit: 10,
        filters: {
          activeTab: 'all'
        }
      };

      api.
        fetchTable(options).
        then((data) => {
          sinon.assert.calledOnce(fetchTableStub);
          assert.deepEqual(data, mockData);
          done();
        });
    });

  });

});
