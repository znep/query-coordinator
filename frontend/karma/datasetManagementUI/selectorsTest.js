import { expect, assert } from 'chai';
import * as Selectors from 'selectors';
import { STATUS_UPDATING, STATUS_SAVED } from 'lib/database/statuses';

describe('Selectors', () => {

  describe('rowsUpserted', () => {

    it('returns the number of rows upserted for an upsert job', () => {
      const db = {
        upsert_jobs: {
          51: {
            id: 51,
          },
          52: {
            id: 52,
            log: [
              {
                stage: 'columns_created'
              },
              {
                stage: 'rows_upserted',
                details: {
                  count: 10000
                }
              },
              {
                stage: 'rows_upserted',
                details: {
                  count: 15000
                }
              }
            ]
          }
        }
      };
      assert.equal(Selectors.rowsUpserted(db, 52), 15000);
    });

    it('returns 0 if we haven\'t created any columns yet', () => {
      const db = {
        upsert_jobs: {
          51: {
            id: 51
          },
          52: {
            id: 52,
            log: [
              {
                stage: 'columns_created'
              }
            ]
          }
        }
      };
      assert.equal(Selectors.rowsUpserted(db, 52), 0);
    });

  });

  describe('columnsForOutputSchema', () => {

    it('returns all columns for an output schema', () => {
      const db = {
        output_schemas: {
          1: { id: 1 },
          5: { id: 5 },
          7: { id: 7 }
        },
        output_columns: {
          51: { id: 51, schema_column_index: 7, transform_id: 1 },
          52: { id: 52, schema_column_index: 0, transform_id: 2 },
          53: { id: 53, schema_column_index: 1, transform_id: 3 },
          54: { id: 54, schema_column_index: 2, transform_id: 4 },
          55: { id: 55, schema_column_index: 5, transform_id: 5 }
        },
        transforms: {
          1: { id: 1 },
          2: { id: 2 },
          3: { id: 3 },
          4: { id: 4 },
          5: { id: 5 }
        },
        output_schema_columns: {
          '5-51': { output_schema_id: 5, output_column_id: 51 },
          '1-52': { output_schema_id: 1, output_column_id: 52 },
          '1-53': { output_schema_id: 1, output_column_id: 53 },
          '1-54': { output_schema_id: 1, output_column_id: 54 },
          '7-55': { output_schema_id: 7, output_column_id: 55 }
        }
      };
      assert.deepEqual(Selectors.columnsForOutputSchema(db, 1), [
        { id: 52, schema_column_index: 0, transform_id: 2, transform: { id: 2 } },
        { id: 53, schema_column_index: 1, transform_id: 3, transform: { id: 3 } },
        { id: 54, schema_column_index: 2, transform_id: 4, transform: { id: 4 } }
      ]);
    });

  });

  describe('uploadsInProgress', () => {

    it('returns all uploads that are updating', () => {
      const db = {
        uploads: {
          55: {
            __status__: { type: STATUS_UPDATING },
            id: 55,
            finished_at: null
          },
          56: {
            __status__: { type: STATUS_SAVED },
            id: 56,
            finished_at: new Date(1484015709529)
          },
        }
      };
      assert.deepEqual(Selectors.uploadsInProgress(db), [
        {
          __status__: { type: STATUS_UPDATING },
          id: 55,
          finished_at: null
        }
      ]);
    });

  });

  describe('latestOutputSchema', () => {

    it('returns schema with the highest id', () => {
      const db = {
        output_schemas: {
          1: { id: 1 },
          2: { id: 2 }
        }
      };
      assert.deepEqual(Selectors.latestOutputSchema(db), { id: 2 });
    });

    it('returns undefined if there are no output schemas', () => {
      const db = {
        output_schemas: {}
      };
      assert.deepEqual(Selectors.latestOutputSchema(db), undefined);
    });

  });

  describe('rowsTransformed', () => {

    it('returns the min of contiguous_rows_transformed', () => {
      const columns = [
        { transform: { contiguous_rows_processed: 20 } },
        { transform: { contiguous_rows_processed: 30 } }
      ];
      assert.equal(Selectors.rowsTransformed(columns), 20);
    });

    it('returns 0 if some transforms have no contiguous_rows_transform attribute', () => {
      const columns = [
        { transform: { contiguous_rows_processed: 20 } },
        { transform: {} }
      ];
      assert.equal(Selectors.rowsTransformed(columns), 0);
    });

    it('returns 0 if none of the transforms have a contiguous_rows_transform attribute', () => {
      const columns = [
        { transform: {} },
        { transform: {} }
      ];
      assert.equal(Selectors.rowsTransformed(columns), 0);
    });

  });

});
