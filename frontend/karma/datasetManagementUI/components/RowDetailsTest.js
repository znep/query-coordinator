import { expect, assert } from 'chai';
import RowDetails from 'components/RowDetails';
import { getDefaultStore } from '../testStore';
import { upsertFromServer } from 'actions/database';

describe('RowDetails', () => {

  it('renders when there is no output schema', () => {
    const store = getDefaultStore();
    const element = renderComponentWithStore(RowDetails, {}, store);

    assert.isNotNull(element);
  });

  it('renders when there is an output schema, but transforms have no rows yet', () => {
    const store = getDefaultStore();
    store.dispatch(upsertFromServer('uploads', { id: 1 }));
    store.dispatch(upsertFromServer('input_schemas', { id: 1, upload_id: 1 }));
    store.dispatch(upsertFromServer('output_schemas', { id: 1, input_schema_id: 1 }));
    store.dispatch(upsertFromServer('output_schema_columns', {
      output_schema_id: 1,
      output_column_id: 1
    }));
    store.dispatch(upsertFromServer('output_columns', {
      position: 0,
      id: 1,
      field_name: 'Address',
      display_name: 'Address',
      description: null,
      transform_id: 620,
      __status__: {
        type: 'SAVED',
        savedAt: 'ON_SERVER'
      }
    }));
    store.dispatch(upsertFromServer('transforms', {
      id: 620,
      output_soql_type: 'SoQLText'
    }));
    const element = renderComponentWithStore(RowDetails, {}, store);
    assert.isNotNull(element);
  });

  it('renders when there is an output schema, but transforms have no rows yet', () => {
    const store = getDefaultStore();
    store.dispatch(upsertFromServer('uploads', { id: 1 }));
    store.dispatch(upsertFromServer('input_schemas', { id: 1, upload_id: 1 }));
    store.dispatch(upsertFromServer('output_schemas', { id: 1, input_schema_id: 1 }));
    store.dispatch(upsertFromServer('output_schema_columns', {
      output_schema_id: 1,
      output_column_id: 1
    }));
    store.dispatch(upsertFromServer('output_columns', {
      position: 0,
      id: 1,
      field_name: 'Address',
      display_name: 'Address',
      description: null,
      transform_id: 620,
      __status__: {
        type: 'SAVED',
        savedAt: 'ON_SERVER'
      }
    }));
    store.dispatch(upsertFromServer('transforms', {
      id: 620,
      output_soql_type: 'SoQLText',
      contiguous_rows_processed: 15
    }));
    const element = renderComponentWithStore(RowDetails, {}, store);
    assert.isNotNull(element);
  });

});
