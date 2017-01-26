import { insertFromServer, createTable } from 'actions/database';
import { getDefaultStore } from '../testStore';

export function getStoreWithOutputSchema() {
  const store = getDefaultStore();
  store.dispatch(insertFromServer('output_schemas', {
    id: 18,
    input_schema_id: 4
  }));
  store.dispatch(insertFromServer('columns', {
    id: 50,
    schema_column_index: 0,
    schema_column_name: 'arrest',
    display_name: 'arrest',
    soql_type: 'SoQLText'
  }));
  store.dispatch(insertFromServer('columns', {
    id: 51,
    schema_column_index: 1,
    schema_column_name: 'block',
    display_name: 'block',
    soql_type: 'SoQLText'
  }));
  store.dispatch(insertFromServer('output_schema_columns', {
    id: 0,
    output_schema_id: 18,
    column_id: 50
  }));
  store.dispatch(insertFromServer('output_schema_columns', {
    id: 1,
    output_schema_id: 18,
    column_id: 51
  }));
  store.dispatch(insertFromServer('transforms', {
    id: 1,
    transform_expr: 'arrest',
    input_column_ids: [48],
    output_column_id: 50
  }));
  store.dispatch(insertFromServer('transforms', {
    id: 2,
    transform_expr: 'block',
    input_column_ids: [49],
    output_column_id: 51
  }));
  store.dispatch(createTable('column_50'));
  store.dispatch(createTable('column_51'));
  return store;
}
