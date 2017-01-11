import _ from 'lodash';
import { Simulate } from 'react-addons-test-utils';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import ShowOutputSchema from 'components/ShowOutputSchema';
import { ShowOutputSchema as ShowOutputSchemaUnConnected } from 'components/ShowOutputSchema';
import { insertFromServer, updateFromServer, batch } from 'actions/database';
import { statusSavedOnServer } from 'lib/database/statuses';

describe('components/ShowOutputSchema', () => {

  const defaultProps = {
    params: {
      uploadId: 5,
      schemaId: 4,
      outputSchemaId: 18
    },
    updateColumnType: _.noop
  };

  it('renders a table without data', () => {
    const store = getStoreWithOutputSchema();
    const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
    expect(_.map(element.querySelectorAll('.col-name'), 'innerText')).to.eql(['arrest', 'block']);
    expect(_.map(element.querySelectorAll('select'), 'value')).to.eql(['SoQLText', 'SoQLText']);
    expect(_.map(element.querySelectorAll('.col-errors'), 'innerText')).to.eql([
      I18n.show_output_schema.column_header.scanning,
      I18n.show_output_schema.column_header.scanning
    ]);
  });

  it('renders a table with data', () => {
    const store = getStoreWithOutputSchema();
    store.dispatch(insertFromServer('column_50', [
      { index: 0, ok: 'foo' },
      { index: 1, error: { message: 'some transform error', inputs: { arrest: { ok: 'bar' } } } },
      { index: 2, ok: 'baz' }
    ]));
    store.dispatch(updateFromServer('columns', {
      id: 50,
      contiguous_rows_processed: 3
    }));

    store.dispatch(insertFromServer('column_51', [
      { index: 0, ok: 'bleep' },
      { index: 1, ok: 'bloop' },
      { index: 2, ok: 'blorp' }
    ]));
    store.dispatch(updateFromServer('columns', {
      id: 51,
      contiguous_rows_processed: 3
    }));
    const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
    const rows = element.querySelectorAll('tbody tr');
    expect(_.map(rows[0].querySelectorAll('td'), 'innerText')).to.eql(['foo', 'bleep']);
    expect(_.map(rows[1].querySelectorAll('td'), 'innerText')).to.eql(['bar', 'bloop']);
    expect(_.map(rows[2].querySelectorAll('td'), 'innerText')).to.eql(['baz', 'blorp']);
    expect(_.map(element.querySelectorAll('.col-errors'), 'innerText')).to.eql([
      I18n.show_output_schema.column_header.no_errors_exist,
      I18n.show_output_schema.column_header.no_errors_exist
    ]);
    expect(element.querySelectorAll('.error').length).to.equal(1);
  });

  it('calls `updateColumnType` when a selector is changed', () => {
    const spy = sinon.spy();
    const props = {
      db: {
        column_50: [],
        column_51: []
      },
      updateColumnType: spy,
      upload: {
        __status__: statusSavedOnServer,
        filename: 'foo.csv'
      },
      columns: [
        { id: 50, display_name: 'arrest', soql_type: 'SoQLText' },
        { id: 51, display_name: 'block', soql_type: 'SoQLText' }
      ],
      outputSchema: { input_schema_id: 4 },
      goToUpload: _.noop
    };
    const element = renderPureComponent(ShowOutputSchemaUnConnected(props));
    const firstSelect = element.querySelector('select');
    firstSelect.value = 'SoQLNumber';
    Simulate.change(firstSelect);
    expect(spy.callCount).to.eql(1);
    expect(spy.args[0]).to.eql([
      { input_schema_id: 4 },
      { id: 50, display_name: 'arrest', soql_type: 'SoQLText' },
      'SoQLNumber'
    ]);
  });


  it('properly renders error counts', () => {
    const store = getStoreWithOutputSchema();

    store.dispatch(updateFromServer('columns', {
      id: 50,
      num_transform_errors: 1
    }));

    store.dispatch(updateFromServer('columns', {
      id: 51,
      num_transform_errors: 42
    }));

    const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
    expect(_.map(element.querySelectorAll('.col-name'), 'innerText')).to.eql(['arrest', 'block']);
    expect(_.map(element.querySelectorAll('select'), 'value')).to.eql(['SoQLText', 'SoQLText']);
    expect(_.map(element.querySelectorAll('.col-errors'), 'innerText')).to.eql([
      '1' + I18n.show_output_schema.column_header.error_exists,
      '42' + I18n.show_output_schema.column_header.errors_exist
    ]);
  });
});
