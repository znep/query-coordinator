import { insertFromServer, createTable } from 'actions/database';
import { getDefaultStore } from '../testStore';

export function getStoreWithOneColumn(store = getDefaultStore()) {
  // already in default store
  // store.dispatch(insertFromServer('input_schemas', {
  //   id: 4,
  // }));
  store.dispatch(insertFromServer('output_schemas', {
    id: 18,
    input_schema_id: 4
  }));
  store.dispatch(insertFromServer('output_columns', {
    id: 50,
    position: 0,
    field_name: 'arrest',
    description: null,
    display_name: 'arrest',
    transform_id: 1
  }));
  store.dispatch(insertFromServer('output_schema_columns', {
    id: 0,
    output_schema_id: 18,
    output_column_id: 50
  }));
  store.dispatch(insertFromServer('input_columns', {
    id: 1,
    field_name: 'arrest',
    soql_type: 'text',
    input_schema_id: 4
  }))
  store.dispatch(insertFromServer('input_columns', {
    id: 2,
    field_name: 'block',
    soql_type: 'text',
    input_schema_id: 4
  }))
  store.dispatch(insertFromServer('transforms', {
    id: 1,
    transform_expr: 'arrest',
    output_soql_type: 'text',
    transform_input_columns: [{
      input_column_id: 1
    }]
  }));
  store.dispatch(createTable('transform_1'));
  return store;
}
