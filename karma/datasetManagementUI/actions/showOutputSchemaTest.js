import { push } from 'react-router-redux';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import errorTableResponse from '../data/errorTableResponse';

import {
  getNewOutputSchemaAndColumns,
  updateActions,
  loadErrorTable
} from 'actions/showOutputSchema';
import {
  batch,
  insertSucceeded,
  insertFromServerIfNotExists
} from 'actions/database';

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
          transform: {
            transform_expr: 'to_number(arrest)'
          }
        },
        {
          display_name: 'block',
          position: 1,
          field_name: 'block',
          transform: {
            transform_expr: 'block'
          }
        }
      ]);
    });

  });

  describe('loadErrorTable', () => {

    it('fetches errors, inserts them into column tables, and updates error_indices in columns table', (done) => {
      const store = getStoreWithOutputSchema();
      const nextRouterState = {
        params: {
          inputSchemaId: 4,
          outputSchemaId: 18,
          errorsTransformId: 1
        }
      };
      const oldFetch = window.fetch;
      window.fetch = (url, params) => {
        const responses = {
          '/api/update/hehe-hehe/0/schema/4/errors/18?limit=50&offset=0&column_id=50': errorTableResponse
        };
        if (responses[url]) {
          return new Promise((resolve) => {
            resolve({
              status: 200,
              json: () => (new Promise((resolve) => {
                resolve(errorTableResponse);
              }))
            })
          });
        } else {
          done(new Error(`no mocked url ${url}`));
        }
      };
      store.dispatch(loadErrorTable(nextRouterState));
      setTimeout(() => {
        window.fetch = oldFetch;
        const db = store.getState().db;
        const transform1 = _.find(db.transforms, { id: 1 });
        expect(transform1.error_indices).to.deep.equal(['0', '7']);
        expect(db.transform_1).to.deep.equal({
          '0': {
            error: {
              inputs: {
                arrest: {
                  ok: "031A"
                }
              },
              message: "Failed to convert \"031A\" to number"
            }
          },
          '7': {
            error: {
              inputs: {
                arrest: {
                  ok: "031A"
                }
              },
              message: "Failed to convert \"031A\" to number"
            }
          }
        });
        expect(db.transform_2).to.deep.equal({
          '0': {
            ok: "foo"
          },
          '7': {
            ok: "bar"
          }
        });
        done();
      }, 0);
    });

  });

});
