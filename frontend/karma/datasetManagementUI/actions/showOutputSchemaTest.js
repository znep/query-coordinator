import { expect } from 'chai';
import _ from 'lodash';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import { getNewOutputSchemaAndColumns } from 'actions/showOutputSchema';

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
});
