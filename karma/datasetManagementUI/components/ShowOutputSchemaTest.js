import { getDefaultStore } from '../testStore';
import ShowOutputSchema from 'components/ShowOutputSchema';
import { insertFromServer } from 'actions/database';

describe('components/ShowOutputSchema', () => {

  it('renders without errors', () => {
    const store = getDefaultStore();
    store.dispatch(insertFromServer('schemas', {
      id: 18,
      input_schema_id: 4
    }));
    store.dispatch(insertFromServer('columns', {
      id: 50,
      schema_column_index: 0,
      schema_column_name: 'arrest',
      soql_type: 'text'
    }));
    store.dispatch(insertFromServer('columns', {
      id: 51,
      schema_column_index: 1,
      schema_column_name: 'block',
      soql_type: 'text'
    }));
    store.dispatch(insertFromServer('transforms', {
      id: 1,
      transform_expr: 'identity',
      input_column_ids: [48],
      output_column_id: 50
    }));
    store.dispatch(insertFromServer('transforms', {
      id: 2,
      transform_expr: 'identity',
      input_column_ids: [49],
      output_column_id: 51
    }));
    const props = {
      params: {
        uploadId: 5,
        schemaId: 4,
        outputSchemaId: 18
      }
    };
    const element = renderComponentWithStore(ShowOutputSchema, props, store);
    expect(element).to.exist;
  });

});
