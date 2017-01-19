import * as Selectors from 'selectors';
import { STATUS_UPDATING, STATUS_SAVED } from 'lib/database/statuses';

describe('Selectors', () => {

  describe('rowsTransformed', () => {

    it('returns the min of all columns with transformed rows', () => {
      const db = {
        schemas: [
          { id: 1 },
          { id: 5 },
          { id: 7 }
        ],
        columns: [
          { id: 51, schema_column_index: 7 },
          { id: 52, schema_column_index: 0, contiguous_rows_processed: 700 },
          { id: 53, schema_column_index: 1, contiguous_rows_processed: 500 },
          { id: 54, schema_column_index: 2, contiguous_rows_processed: 1000 },
          { id: 55, schema_column_index: 5 }
        ],
        schema_columns: [
          { schema_id: 5, column_id: 51 },
          { schema_id: 1, column_id: 52 },
          { schema_id: 1, column_id: 53 },
          { schema_id: 1, column_id: 54 },
          { schema_id: 7, column_id: 55 }
        ]
      };
      expect(Selectors.rowsTransformed(db, 1)).to.eql(500);
    });

    it('returns 0 when one column doesn\'t have any transformed rows yet', () => {
      const db = {
        schemas: [
          { id: 1 },
          { id: 5 },
          { id: 7 }
        ],
        columns: [
          { id: 51, schema_column_index: 7 },
          { id: 52, schema_column_index: 0, contiguous_rows_processed: 700 },
          { id: 53, schema_column_index: 1 }, // left blank in real life til channel updates it
          { id: 54, schema_column_index: 2, contiguous_rows_processed: 1000 },
          { id: 55, schema_column_index: 5 }
        ],
        schema_columns: [
          { schema_id: 5, column_id: 51 },
          { schema_id: 1, column_id: 52 },
          { schema_id: 1, column_id: 53 },
          { schema_id: 1, column_id: 54 },
          { schema_id: 7, column_id: 55 }
        ]
      };
      expect(Selectors.rowsTransformed(db, 1)).to.eql(0);
    });

  });

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
        schemas: [
          { id: 1 },
          { id: 5 },
          { id: 7 }
        ],
        columns: [
          { id: 51, schema_column_index: 7 },
          { id: 52, schema_column_index: 0 },
          { id: 53, schema_column_index: 1 },
          { id: 54, schema_column_index: 2 },
          { id: 55, schema_column_index: 5 }
        ],
        schema_columns: [
          { schema_id: 5, column_id: 51 },
          { schema_id: 1, column_id: 52 },
          { schema_id: 1, column_id: 53 },
          { schema_id: 1, column_id: 54 },
          { schema_id: 7, column_id: 55 }
        ]
      };
      expect(Selectors.columnsForOutputSchema(db, 1)).to.eql([
        { id: 52, schema_column_index: 0 },
        { id: 53, schema_column_index: 1 },
        { id: 54, schema_column_index: 2 }
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
