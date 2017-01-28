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
      const oldColumn = _.find(db.columns, { id: 50 });
      const newType = 'SoQLNumber';

      const result = getNewOutputSchemaAndColumns(db, oldSchema, oldColumn, newType);

      expect(result.newOutputSchema.input_schema_id).to.eql(oldSchema.input_schema_id);
      expect(result.oldOutputColIds).to.eql([50, 51]);
      expect(result.newOutputColumns).to.eql([
        {
          display_name: 'arrest',
          schema_column_index: 0,
          schema_column_name: 'arrest',
          transform_to: {
            transform_expr: 'to_number(arrest)'
          }
        },
        {
          display_name: 'block',
          schema_column_index: 1,
          schema_column_name: 'block',
          transform_to: {
            transform_expr: 'block'
          }
        }
      ]);
    });

  });

  describe('updateActions', () => {

    it('returns actions which insert a new output schema and redirect to it', () => {
      // Inputs.
      const inputSchema = { id: 1, upload_id: 0 };
      const oldSchema = { input_schema_id: inputSchema.id, id: 3 };
      const inputSchemas = [inputSchema];
      const newSchema = { input_schema_id: inputSchema.id };

      const pathname = '/dataset/n/feed-cafe/updates/0/uploads/0/schemas/1/output/3';
      const routing = {
        locationBeforeTransitions: {
          'pathname': pathname,
          'search': '',
          'hash': '',
          'action': 'PUSH',
          'key': 'abcdef',
          'query':{}
        }
      };

      const oldColIds = [5, 7];
      const newColId = 11;
      const newSchemaId = 23;
      const transformId = 29;

      const resp = {
        resource: {
          id: newSchemaId,
          output_columns: [
            { id: 5 },
            { id: 7 },
            {
              id: newColId,
              transform_to: {
                id: transformId,
                transform_input_columns: [
                  { ignored_field: 'these are not the droids you are looking for', column_id: 13 },
                  { column_id: 17 }
                ]
              }
            }
          ]
        }
      };

      const oldSchemaColumns = oldColIds.map(id =>
        insertFromServerIfNotExists('output_schema_columns', {
          column_id: id,
          output_schema_id: newSchemaId
        })
      );
      const newSchemaColumn = insertFromServerIfNotExists('output_schema_columns', {
        column_id: newColId,
        output_schema_id: newSchemaId
      });

      // Expected.
      const expected = [
        insertSucceeded('output_schemas', { input_schema_id: inputSchema.id }, { id: newSchemaId }),
        insertFromServerIfNotExists('columns', { id: newColId }),
        batch(_.concat(oldSchemaColumns, newSchemaColumn)),
        insertFromServerIfNotExists('transforms', { id: transformId, input_column_ids: [13, 17] }),
        push(pathname.replace(/3$/, newSchemaId))
      ];

      const actions = updateActions(inputSchemas, routing, oldSchema, newSchema, oldColIds, resp);

      expect(_.filter(actions, act => typeof(act) !== 'function')).to.deep.equal(expected);
    });

  });

  describe('loadErrorTable', () => {

    it('fetches errors, inserts them into column tables, and updates error_indices in columns table', (done) => {
      const store = getStoreWithOutputSchema();
      const nextRouterState = {
        params: {
          inputSchemaId: 4,
          outputSchemaId: 18,
          errorsColumnId: 50
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
        const column50 = _.find(db.columns, { id: 50 });
        expect(column50.error_indices).to.deep.equal(['0', '7']);
        expect(db.column_50).to.deep.equal({
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
        expect(db.column_51).to.deep.equal({
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
