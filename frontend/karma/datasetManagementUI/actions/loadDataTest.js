import { expect } from 'chai';
import _ from 'lodash';

import { mockFetch } from '../testHelpers/mockHTTP';
import { normalWithErrorsResponse, rowErrorResponse, columnErrorResponse } from '../data/errorTableResponse';
import { getStoreWithOutputSchema, getStoreWithProcessedRows } from '../data/storeWithOutputSchema';

import * as dsmapiLinks from 'dsmapiLinks';
import { loadStarted, loadSucceeded } from 'actions/database';
import * as DisplayState from 'lib/displayState';
import { statusSavedOnServer } from 'lib/database/statuses';
import { getLoadPlan,
         loadNormalPreview,
         loadRowErrors,
         loadColumnErrors,
         PAGE_SIZE} from 'actions/loadData';

function afterNextFrameRender(body) {
  setTimeout(body, 0);
}

const uploadId = 5;
const inputSchemaId = 4;
const outputSchemaId = 18;
const pageNo = 1;

describe('getLoadPlan', () => {
  it('DisplayState.NORMAL returns plan when not loaded', () => {
    const store = getStoreWithProcessedRows();
    const db = store.getState().db;

    const displayState = {
      type: DisplayState.NORMAL,
      outputSchemaId,
      pageNo
    };

    const plan = {
      type: 'NORMAL',
      outputSchemaId,
      pageNo
    };

     expect(getLoadPlan(db, displayState)).to.deep.equal(plan);
  });

  it('DisplayState.ROW_ERRORS returns plan when not loaded', () => {
    const store = getStoreWithProcessedRows();
    const db = store.getState().db;

    const displayState = {
      type: DisplayState.ROW_ERRORS,
      outputSchemaId,
      pageNo
    };

    const plan = {
      type: 'ROW_ERRORS',
      inputSchemaId,
      pageNo
    };

    expect(getLoadPlan(db, displayState)).to.deep.equal(plan);
  });

  it('DisplayState.COLUMN_ERRORS returns plan when not loaded', () => {
    const store = getStoreWithProcessedRows();
    const db = store.getState().db;

    const displayState = {
      type: DisplayState.COLUMN_ERRORS,
      pageNo,
      outputSchemaId,
      transformId: 1
    };

    const plan = {
      type: 'COLUMN_ERRORS',
      transformId: 1,
      pageNo,
      outputSchemaId
    };

    expect(getLoadPlan(db, displayState)).to.deep.equal(plan);
  });

  it('Returns null when loaded for all display states', () => {
    const store = getStoreWithProcessedRows();

    const columnId = 50;

    const displayState = {
      pageNo,
      transformId: 1
    };

    const rowsLink = dsmapiLinks.rows(
      uploadId, inputSchemaId, outputSchemaId, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE);
    store.dispatch(loadStarted(rowsLink));
    store.dispatch(loadSucceeded(rowsLink));

    const rowErrorsLink = dsmapiLinks.rowErrors(
      uploadId, inputSchemaId, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE);
    store.dispatch(loadStarted(rowErrorsLink));
    store.dispatch(loadSucceeded(rowErrorsLink));

    const columnErrorsLink = dsmapiLinks.columnErrors(
      uploadId, inputSchemaId, outputSchemaId, columnId, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE);
    store.dispatch(loadStarted(columnErrorsLink));
    store.dispatch(loadSucceeded(columnErrorsLink));

    const db = store.getState().db;

    expect(getLoadPlan(db, outputSchemaId, {
      ...displayState,
      type: DisplayState.NORMAL
    })).to.equal(null);

    expect(getLoadPlan(db, outputSchemaId, {
      ...displayState,
      type: DisplayState.ROW_ERRORS
    })).to.equal(null);

    expect(getLoadPlan(db, outputSchemaId, {
      ...displayState,
      type: DisplayState.COLUMN_ERRORS
    })).to.equal(null);
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

    const displayState = {
      type: DisplayState.NORMAL,
      outputSchemaId,
      pageNo
    };

    store.dispatch(loadNormalPreview(displayState));

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

    const displayState = {
      type: DisplayState.ROW_ERRORS,
      outputSchemaId,
      pageNo
    };

    store.dispatch(loadRowErrors(displayState));
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
    const transformId =  1;
    const displayState = {
      type: DisplayState.COLUMN_ERRORS,
      transformId,
      outputSchemaId,
      pageNo
    };

    const { unmockFetch } = mockFetch({
      '/api/publishing/v1/upload/5/schema/4/errors/18?limit=50&offset=0&column_id=50': {
        GET: {
          status: 200,
          response: columnErrorResponse
        }
      }
    });

    store.dispatch(loadColumnErrors(displayState));
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
