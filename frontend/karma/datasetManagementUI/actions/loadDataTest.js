import { expect } from 'chai';
import _ from 'lodash';

import { mockFetch } from '../testHelpers/mockHTTP';
import errorTableResponse from '../data/errorTableResponse';
import { getStoreWithOutputSchema, getStoreWithProcessedRows } from '../data/storeWithOutputSchema';

import * as dsmapiLinks from 'dsmapiLinks';
import { insertFromServer } from 'actions/database';
import * as DisplayState from 'lib/displayState';
import { statusSavedOnServer } from 'lib/database/statuses';
import { getLoadPlan,
         loadNormalPreview,
         loadRowErrors,
         loadColumnErrors,
         PAGE_SIZE} from 'actions/loadData';

describe.only('getLoadPlan', () => {
  it('DisplayState.NORMAL returns plan when not loaded', () => {
    const store = getStoreWithProcessedRows();
    const db = store.getState().db;

    const outputSchemaId = 18;
    const displayState = {
      type: DisplayState.NORMAL,
      pageNo: 1
    };

    const plan = {
      type: 'NORMAL',
      outputSchemaId: outputSchemaId,
      pageNo: 1
    };

     expect(getLoadPlan(db, outputSchemaId, displayState)).to.deep.equal(plan);
  });

  it('DisplayState.ROW_ERRORS returns plan when not loaded', () => {
    const store = getStoreWithProcessedRows();
    const db = store.getState().db;

    const outputSchemaId = 18;
    const displayState = {
      type: DisplayState.ROW_ERRORS,
      pageNo: 1
    };

    const plan = {
      type: 'ROW_ERRORS',
      inputSchemaId: 4,
      pageNo: 1
    };

    expect(getLoadPlan(db, outputSchemaId, displayState)).to.deep.equal(plan);
  });

  it('DisplayState.COLUMN_ERRORS returns plan when not loaded', () => {
    const store = getStoreWithProcessedRows();
    const db = store.getState().db;

    const outputSchemaId = 18;
    const displayState = {
      type: DisplayState.COLUMN_ERRORS,
      pageNo: 1,
      transformId: 1
    };

    const plan = {
      type: 'COLUMN_ERRORS',
      transformId: 1,
      pageNo: 1,
      outputSchemaId
    };

    expect(getLoadPlan(db, outputSchemaId, displayState)).to.deep.equal(plan);
  });

  it('Returns null when loaded for all display states', () => {
    const store = getStoreWithProcessedRows();

    const uploadId = 5;
    const inputSchemaId = 4;
    const outputSchemaId = 18;
    const pageNo = 1;
    const columnId = 50;

    const displayState = {
      pageNo,
      transformId: 1
    };

    store.dispatch(insertFromServer('__loads__', {
      id: 0,
      url: dsmapiLinks.rows(uploadId, inputSchemaId, outputSchemaId, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE)
    }));

    store.dispatch(insertFromServer('__loads__', {
      id: 1,
      url: dsmapiLinks.rowErrors(uploadId, inputSchemaId, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE)
    }));

    store.dispatch(insertFromServer('__loads__', {
      id: 2,
      url: dsmapiLinks.columnErrors(
        uploadId, inputSchemaId, outputSchemaId, columnId, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE)
    }));

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
  it('fetches normal rows without errors');
  it('fetches normal rows with row and column errors');
});

describe('loadRowErrors', () => {
  it('fetches error rows');
});

describe('loadColumnErrors', () => {
  it('fetches errors, inserts them into column tables with error_indices in columns table', (done) => {
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
