import { expect } from 'chai';
import _ from 'lodash';

import { mockFetch } from '../testHelpers/mockHTTP';
import errorTableResponse from '../data/errorTableResponse';
import { statusSavedOnServer } from 'lib/database/statuses';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';

import { loadColumnErrors } from 'actions/loadData';

describe('loadColumnErrors', () => {
  it('fetches errors, inserts them into column tables, and updates error_indices in columns table', (done) => {
    const store = getStoreWithOutputSchema();
    const transformId =  1;
    const outputSchemaId = 18;
    const pageNo = 1;

    const { unmockFetch } = mockFetch({
      '/api/publishing/v1/upload/5/schema/4/errors/18?limit=50&offset=0&column_id=50': {
        GET: {
          status: 200,
          response: errorTableResponse
        }
      }
    });

    store.dispatch(loadColumnErrors(transformId, outputSchemaId, pageNo));
    setTimeout(() => {
      unmockFetch();
      const db = store.getState().db;
      const transform1 = _.find(db.transforms, { id: 1 });

      expect(transform1.error_indices).to.deep.equal(['0', '7']);
      expect(_.sortBy(_.keys(db.transform_1))).to.deep.equal(['0', '7']);
      // bizarrely, asserting against the whole object fails, but asserting against the
      // individual keys succeeds
      expect(db.transform_1['0']).to.deep.equal({
        __status__: statusSavedOnServer,
        error: {
          inputs: {
            arrest: {
              ok: '031A'
            }
          },
          message: 'Failed to convert "031A" to number'
        }
      });

      expect(db.transform_1['7']).to.deep.equal({
        __status__: statusSavedOnServer,
        error: {
          inputs: {
            arrest: {
              ok: '031A'
            }
          },
          message: 'Failed to convert "031A" to number'
        }
      });

      expect(db.transform_2).to.deep.equal({
        '0': {
          ok: 'foo',
          __status__: statusSavedOnServer
        },
        '7': {
          ok: 'bar',
          __status__: statusSavedOnServer
        }
      });
      done();
    }, 0);
  });
});
