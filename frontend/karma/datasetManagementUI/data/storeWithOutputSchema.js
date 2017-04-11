import { updateFromServer, upsertFromServer, createTable } from 'actions/database';
import { getDefaultStore } from '../testStore';

export function getStoreWithOutputSchema(store = getDefaultStore()) {
  // already in default store
  // store.dispatch(upsertFromServer('input_schemas', {
  //   id: 4,
  // }));
  store.dispatch(upsertFromServer('output_schemas', {
    id: 18,
    input_schema_id: 4
  }));
  store.dispatch(upsertFromServer('output_columns', {
    id: 50,
    position: 0,
    field_name: 'arrest',
    description: null,
    display_name: 'arrest',
    transform_id: 1
  }));
  store.dispatch(upsertFromServer('output_columns', {
    id: 51,
    position: 1,
    field_name: 'block',
    description: null,
    display_name: 'block',
    transform_id: 2
  }));
  store.dispatch(upsertFromServer('output_schema_columns', {
    id: 0,
    output_schema_id: 18,
    output_column_id: 50
  }));
  store.dispatch(upsertFromServer('output_schema_columns', {
    id: 1,
    output_schema_id: 18,
    output_column_id: 51
  }));
  store.dispatch(upsertFromServer('transforms', {
    id: 1,
    transform_expr: 'arrest',
    output_soql_type: 'SoQLText'
  }));
  store.dispatch(upsertFromServer('transforms', {
    id: 2,
    transform_expr: 'block',
    output_soql_type: 'SoQLText'
  }));
  store.dispatch(createTable('transform_1'));
  store.dispatch(createTable('transform_2'));
  return store;
}

export function getStoreWithProcessedRows(store = getDefaultStore()) {
  const osStore = getStoreWithOutputSchema(store);

  osStore.dispatch(updateFromServer('transforms', {
    id: 1,
    contiguous_rows_processed: 2
  }));
  osStore.dispatch(updateFromServer('transforms', {
    id: 2,
    contiguous_rows_processed: 2
  }));
  osStore.dispatch(updateFromServer('input_schemas', {
    id: 4,
    total_rows: 2
  }));

  return osStore;
}
