import { expect, assert } from 'chai';
import _ from 'lodash';
import {
  outputColumnsWithChangedType,
  loadColumnErrors,
  addColumn,
  dropColumn
} from 'actions/showOutputSchema';
import {
  batch,
  insertSucceeded,
  insertFromServerIfNotExists,
  updateFromServer
} from 'actions/database';
import { statusSavedOnServer } from 'lib/database/statuses';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
// import mockPhx from '../testHelpers/mockPhoenixSocket';
// import { getStoreWithOneColumn } from '../data/storeWithOneColumn';
// import errorTableResponse from '../data/errorTableResponse';
// import addColumnResponse from '../data/addColumnResponse';

describe.only('actions/showOutputSchema', () => {

  describe('outputColumnsWithChangedType', () => {

    it('constructs a new output schema, given a new column', () => {
      const store = getStoreWithOutputSchema();

      const db = store.getState().db;
      const oldSchema = _.find(db.output_schemas, { id: 18 });
      const oldColumn = _.find(db.output_columns, { id: 50 });
      const newType = 'SoQLNumber';

      const newOutputCols = outputColumnsWithChangedType(db, oldSchema, oldColumn, newType);

      expect(newOutputCols).to.eql([
        {
          display_name: 'arrest',
          position: 0,
          field_name: 'arrest',
          description: null,
          is_primary_key: false,
          transform: {
            transform_expr: 'to_number(arrest)'
          }
        },
        {
          display_name: 'block',
          position: 1,
          field_name: 'block',
          description: null,
          is_primary_key: false,
          transform: {
            transform_expr: 'block'
          }
        }
      ]);
    });

    it('uses the input column\'s field name in the transform even if the output column\'s field name has changed', () => {
      // ...than the input column's fieldname
      const store = getStoreWithOutputSchema();

      store.dispatch(updateFromServer('output_columns', {
        id: 50,
        field_name: 'user_edited_this_fieldname'
      }));

      const db = store.getState().db;
      const oldSchema = _.find(db.output_schemas, { id: 18 });
      const oldColumn = _.find(db.output_columns, { id: 50 });
      const newType = 'SoQLNumber';

      const newOutputCols = outputColumnsWithChangedType(db, oldSchema, oldColumn, newType);

      expect(newOutputCols).to.eql([
        {
          display_name: 'arrest',
          position: 0,
          field_name: 'user_edited_this_fieldname', // save that they modified the fieldname
          description: null,
          is_primary_key: false,
          transform: {
            transform_expr: 'to_number(arrest)' // but transform from the original
          }
        },
        {
          display_name: 'block',
          position: 1,
          field_name: 'block',
          description: null,
          is_primary_key: false,
          transform: {
            transform_expr: 'block'
          }
        }
      ]);
    })

  });

  // This should be tested but for some reason the channel
  // global is getting wiped out by some other test??
  // describe('addColumn', () => {

  //   it.only('does the thing', (done) => {
  //     const unmockPhx = mockPhx({
  //       'output_schema:90': [],
  //       'row_errors:4': []
  //     }, done);

  //     const store = getStoreWithOneColumn();
  //     var db = store.getState().db;

  //     const { unmockFetch } = mockFetch({
  //       '/api/publishing/v1/upload/5/schema/4': {
  //         POST: {
  //           status: 200,
  //           response: addColumnResponse
  //         }
  //       }
  //     });
  //     const outputSchema = db.output_schemas[18];
  //     const inputColumn = db.input_columns[2];
  //     store.dispatch(addColumn(outputSchema, inputColumn));
  //     setTimeout(() => {
  //       unmockFetch();
  //       unmockPhx();
  //       db = store.getState().db;
  //       console.log("WATTTT")
  //       done();
  //     }, 0);
  //   });

  // });

});
