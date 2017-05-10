import { expect } from 'chai';
import _ from 'lodash';

import { mockFetch } from '../testHelpers/mockHTTP';
import { normalWithErrorsResponse, rowErrorResponse, columnErrorResponse } from '../data/errorTableResponse';
import { getStoreWithOutputSchema, getStoreWithProcessedRows } from '../data/storeWithOutputSchema';

import {
  apiCallStarted,
  apiCallSucceeded,
  LOAD_ROWS
} from 'actions/apiCalls';
import * as DisplayState from 'lib/displayState';
import { statusSavedOnServer } from 'lib/database/statuses';
import {
  needToLoadAnything,
  loadNormalPreview,
  loadRowErrors,
  loadColumnErrors,
  PAGE_SIZE
} from 'actions/loadData';

function afterNextFrameRender(body) {
  setTimeout(body, 0);
}

describe('actions/loadData', () => {

  const inputSchemaId = 4;
  const outputSchemaId = 18;
  const transformId = 1;
  const pageNo = 1;

  const normalDisplayState = DisplayState.normal(pageNo, outputSchemaId);
  const rowErrorsDisplayState = DisplayState.rowErrors(pageNo, outputSchemaId);
  const columnErrorsDisplayState = DisplayState.columnErrors(transformId, pageNo, outputSchemaId);

  const normalCall = {
    operation: LOAD_ROWS,
    params: {
      displayState: normalDisplayState
    }
  };
  const rowErrorsCall = {
    operation: LOAD_ROWS,
    params: {
      displayState: rowErrorsDisplayState
    }
  };
  const columnErrorsCall = {
    operation: LOAD_ROWS,
    params: {
      displayState: columnErrorsDisplayState
    }
  };


  describe('needToLoadAnything', () => {

    it('DisplayState.NORMAL returns true when not loaded', () => {
      const store = getStoreWithProcessedRows();

       expect(needToLoadAnything(store.getState(), normalDisplayState)).to.deep.equal(true);
    });

    it('DisplayState.ROW_ERRORS returns plan when not loaded', () => {
      const store = getStoreWithProcessedRows();

      expect(needToLoadAnything(store.getState(), rowErrorsDisplayState)).to.deep.equal(true);
    });

    it('DisplayState.COLUMN_ERRORS returns plan when not loaded', () => {
      const store = getStoreWithProcessedRows();

      expect(needToLoadAnything(store.getState(), columnErrorsDisplayState)).to.deep.equal(true);
    });

    it('Returns null when loaded for all display states', () => {
      const store = getStoreWithProcessedRows();

      const normalCallId = 0;
      store.dispatch(apiCallStarted(normalCallId, normalCall));
      store.dispatch(apiCallSucceeded(normalCallId));

      const rowErrorCallId = 1;
      store.dispatch(apiCallStarted(rowErrorCallId, rowErrorsCall));
      store.dispatch(apiCallSucceeded(rowErrorCallId));

      const columnErrorsCallId = 2;
      store.dispatch(apiCallStarted(columnErrorsCallId, columnErrorsCall));
      store.dispatch(apiCallSucceeded(columnErrorsCallId));

      expect(needToLoadAnything(store.getState(), normalCall.params.displayState)).to.equal(false);
      expect(needToLoadAnything(store.getState(), rowErrorsCall.params.displayState)).to.equal(false);
      expect(needToLoadAnything(store.getState(), columnErrorsCall.params.displayState)).to.equal(false);
    });

  });

  describe('loadNormalPreview', () => {
    it('fetches normal rows into transform tables and errors into row_errors', (done) => {
      const store = getStoreWithOutputSchema();

      const { unmockFetch } = mockFetch({
        '/api/publishing/v1/upload/5/schema/4/rows/18?limit=50&offset=0': {
          GET: {
            status: 200,
            response: normalWithErrorsResponse
          }
        }
      });

      const rows = _.filter(normalWithErrorsResponse.slice(1), row => row.row);

      store.dispatch(loadNormalPreview(normalCall));

      afterNextFrameRender(() => {
        unmockFetch();
        const db = store.getState().db;

        const transformIds = _.map(db.transforms, tr => tr.id);
        _.each(transformIds, (tid, colIdx) => {
          const transform = db[`transform_${tid}`];
          _.each(rows, row => {
            const trow = transform[row.offset];
            expect(trow.id).to.equal(row.offset);
            expect(trow.ok).to.equal(row.row[colIdx].ok);
          });
        });

        _.each(rowErrorResponse, error => {
          const rowError = db.row_errors[`${inputSchemaId}-${error.offset}`];
          expect(rowError.offset).to.equal(error.offset);
          _.each(_.keys(error.error), key => {
            expect(rowError[key]).to.equal(error.error[key]);
          });
        });

        done();
      });
    });
  });

  describe('loadRowErrors', () => {
    it('fetches error rows and inserts them into row_errors table', (done) => {
      const store = getStoreWithOutputSchema();

      const { unmockFetch } = mockFetch({
        '/api/publishing/v1/upload/5/schema/4/errors?limit=50&offset=0': {
          GET: {
            status: 200,
            response: rowErrorResponse
          }
        }
      });

      store.dispatch(loadRowErrors(rowErrorsCall));
      afterNextFrameRender(() => {
        unmockFetch();
        const db = store.getState().db;

        _.each(rowErrorResponse, error => {
          const rowError = db.row_errors[`${inputSchemaId}-${error.offset}`];
          expect(rowError.offset).to.equal(error.offset);
          _.each(_.keys(error.error), key => {
            expect(rowError[key]).to.equal(error.error[key]);
          });
        });

        done();
      });
    });
  });

  describe('loadColumnErrors', () => {
    it('fetches errors, inserts them into column tables with error_indices in columns table', (done) => {
      const store = getStoreWithOutputSchema();

      const { unmockFetch } = mockFetch({
        '/api/publishing/v1/upload/5/schema/4/errors/18?limit=50&offset=0&column_id=50': {
          GET: {
            status: 200,
            response: columnErrorResponse
          }
        }
      });

      store.dispatch(loadColumnErrors(columnErrorsCall));
      afterNextFrameRender(() => {
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
      });
    });
  });
});
