import * as Selectors from 'selectors';
import { STATUS_UPDATING, STATUS_SAVED } from 'lib/database/statuses';

describe('Selectors', () => {

  describe('rowsUpserted', () => {

    it('returns the number of rows upserted for an upsert job', () => {
      const db = {
        upsert_jobs: [
          {
            id: 51,
          },
          {
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
        ]
      };
      expect(Selectors.rowsUpserted(db, 52)).to.eql(15000);
    });

    it('returns 0 if we haven\'t created any columns yet', () => {
      const db = {
        upsert_jobs: [
          {
            id: 51,
          },
          {
            id: 52,
            log: [
              {
                stage: 'columns_created'
              }
            ]
          }
        ]
      };
      expect(Selectors.rowsUpserted(db, 52)).to.eql(0);
    });

  });

  describe('columnsForOutputSchema', () => {

    it('returns all columns for an output schema', () => {
      const db = {
        output_schemas: [
          { id: 1 },
          { id: 5 },
          { id: 7 }
        ],
        output_columns: [
          { id: 51, schema_column_index: 7, transform_id: 1 },
          { id: 52, schema_column_index: 0, transform_id: 2 },
          { id: 53, schema_column_index: 1, transform_id: 3 },
          { id: 54, schema_column_index: 2, transform_id: 4 },
          { id: 55, schema_column_index: 5, transform_id: 5 }
        ],
        transforms: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
          { id: 4 },
          { id: 5 }
        ],
        output_schema_columns: [
          { output_schema_id: 5, output_column_id: 51 },
          { output_schema_id: 1, output_column_id: 52 },
          { output_schema_id: 1, output_column_id: 53 },
          { output_schema_id: 1, output_column_id: 54 },
          { output_schema_id: 7, output_column_id: 55 }
        ]
      };
      expect(Selectors.columnsForOutputSchema(db, 1)).to.eql([
        { id: 52, schema_column_index: 0, transform_id: 2, transform: { id: 2 } },
        { id: 53, schema_column_index: 1, transform_id: 3, transform: { id: 3 } },
        { id: 54, schema_column_index: 2, transform_id: 4, transform: { id: 4 } }
      ]);
    });

  });

  describe('uploadsInProgress', () => {

    it('returns all uploads that are updating', () => {
      const db = {
        uploads: [
          {
            __status__: { type: STATUS_UPDATING },
            id: 55,
            finished_at: null
          },
          {
            __status__: { type: STATUS_SAVED },
            id: 55,
            finished_at: new Date(1484015709529)
          },
        ]
      };
      expect(Selectors.uploadsInProgress(db)).to.eql([
        {
          __status__: { type: STATUS_UPDATING },
          id: 55,
          finished_at: null
        }
      ]);
    });

  });

});
