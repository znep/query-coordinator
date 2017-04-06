import { expect } from 'chai';
import _ from 'lodash';
import { mockFetch } from '../testHelpers/mockHTTP';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import errorTableResponse from '../data/errorTableResponse';
import {
  getNewOutputSchemaAndColumns,
  loadColumnErrors
} from 'actions/showOutputSchema';
import { statusSavedOnServer } from 'lib/database/statuses';

describe('actions/showOutputSchema', () => {

  describe('getNewOutputSchemaAndColumns', () => {

    it('constructs a new output schema, given a new column', () => {
      const store = getStoreWithOutputSchema();

      const db = store.getState().db;
      const oldSchema = _.find(db.output_schemas, { id: 18 });
      const oldColumn = _.find(db.output_columns, { id: 50 });
      const newType = 'SoQLNumber';

      const result = getNewOutputSchemaAndColumns(db, oldSchema, oldColumn, newType);

      expect(result.newOutputSchema.input_schema_id).to.eql(oldSchema.input_schema_id);
      expect(result.oldOutputColIds).to.eql([50, 51]);
      expect(result.newOutputColumns).to.eql([
        {
          display_name: 'arrest',
          position: 0,
          field_name: 'arrest',
          description: null,
          transform: {
            transform_expr: 'to_number(arrest)'
          }
        },
        {
          display_name: 'block',
          position: 1,
          field_name: 'block',
          description: null,
          transform: {
            transform_expr: 'block'
          }
        }
      ]);
    });

  });

  describe('loadColumnErrors', () => {

    it('fetches errors, inserts them into column tables, and updates error_indices in columns table', (done) => {
      const store = getStoreWithOutputSchema();
      const nextRouterState = {
        params: {
          inputSchemaId: 4,
          outputSchemaId: 18,
          errorsTransformId: 1,
          uploadId: 5
        }
      };
      const { unmockFetch } = mockFetch({
        '/api/publishing/v1/upload/5/schema/4/errors/18?limit=50&offset=0&column_id=50': {
          GET: {
            status: 200,
            response: errorTableResponse
          }
        }
      });
      store.dispatch(loadColumnErrors(nextRouterState));
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
});
