import _ from 'lodash';
import { Simulate } from 'react-addons-test-utils';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import ShowOutputSchema from 'components/ShowOutputSchema';
import { ShowOutputSchema as ShowOutputSchemaUnConnected } from 'components/ShowOutputSchema';
import * as Selectors from 'selectors';
import { insertFromServer, updateFromServer, batch } from 'actions/database';

describe('components/ShowOutputSchema', () => {

  const defaultProps = {
    params: {
      uploadId: 5,
      inputSchemaId: 4,
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
    store.dispatch(updateFromServer('input_schemas', {
      id: 4,
      total_rows: 3
    }));
    store.dispatch(insertFromServer('transform_1', [
      { index: 0, ok: 'foo' },
      { index: 1, error: { message: 'some transform error', inputs: { arrest: { ok: 'bar' } } } },
      { index: 2, ok: 'baz' }
    ]));
    store.dispatch(updateFromServer('transforms', {
      id: 1,
      contiguous_rows_processed: 3
    }));

    store.dispatch(insertFromServer('transform_2', [
      { index: 0, ok: 'bleep' },
      { index: 1, ok: null },
      { index: 2, ok: 'blorp' }
    ]));
    store.dispatch(updateFromServer('transforms', {
      id: 2,
      contiguous_rows_processed: 3
    }));
    const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
    const rows = element.querySelectorAll('tbody tr');
    expect(_.map(rows[0].querySelectorAll('td'), 'innerText')).to.eql(['foo', 'bleep']);
    expect(_.map(rows[1].querySelectorAll('td'), 'innerText')).to.eql(['bar', '']);
    expect(_.map(rows[2].querySelectorAll('td'), 'innerText')).to.eql(['baz', 'blorp']);
    expect(_.map(element.querySelectorAll('.col-errors'), 'innerText')).to.eql([
      I18n.show_output_schema.column_header.no_errors_exist,
      I18n.show_output_schema.column_header.no_errors_exist
    ]);
    expect(element.querySelectorAll('.error').length).to.equal(1);
    expect(element.querySelectorAll('.empty').length).to.equal(1);
  });

  it('calls `updateColumnType` when a selector is changed', () => {
    const store = getStoreWithOutputSchema();
    const storeDb = store.getState().db;
    const spy = sinon.spy();
    // rendering unconnected version so we can pass in a spy instead of
    // going through mapDispatchToProps
    const props = {
      db: storeDb,
      upload: storeDb.uploads[0],
      inputSchema: storeDb.input_schemas[0],
      outputSchema: storeDb.output_schemas[0],
      columns: Selectors.columnsForOutputSchema(storeDb, storeDb.output_schemas[0].id),
      canApplyUpdate: false,
      updateColumnType: spy,
      goToUpload: _.noop,
      applyUpdate: _.noop
    };
    const element = renderPureComponent(ShowOutputSchemaUnConnected(props));
    const firstSelect = element.querySelector('select');
    firstSelect.value = 'SoQLNumber';
    Simulate.change(firstSelect);
    expect(spy.callCount).to.eql(1);

    const [calledWithOutputSchema, calledWithOutputColumn, calledWithUpdatedType] = spy.args[0];

    expect(calledWithOutputSchema.id).to.eql(storeDb.output_schemas[0].id);
    expect(calledWithOutputColumn.id).to.eql(storeDb.output_columns[0].id);
    expect(calledWithUpdatedType).to.eql('SoQLNumber');
  });

  // these overlap a bit with ColumnStatusTest, but that's not a bad thing IMO
  describe('error counts and flyouts', () => {

    it('properly render when the upload is done', () => {
      const store = getStoreWithOutputSchema();
      store.dispatch(updateFromServer('input_schemas', {
        id: 4,
        total_rows: 3
      }));
      store.dispatch(updateFromServer('transforms', {
        id: 1,
        contiguous_rows_processed: 3,
        num_transform_errors: 1
      }));

      store.dispatch(updateFromServer('transforms', {
        id: 2,
        contiguous_rows_processed: 3,
        num_transform_errors: 42
      }));

      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(_.map(element.querySelectorAll('.col-name'), 'innerText')).to.eql(['arrest', 'block']);
      expect(_.map(element.querySelectorAll('select'), 'value')).to.eql(['SoQLText', 'SoQLText']);
      expect(_.map(element.querySelectorAll('.column-status-text'), 'innerText')).to.eql([
        '1' + I18n.show_output_schema.column_header.error_exists,
        '42' + I18n.show_output_schema.column_header.errors_exist
      ]);
    });

    it('properly render when the upload is still in progress', () => {
      const SubI18n = I18n.show_output_schema.column_header;
      const store = getStoreWithOutputSchema();
      store.dispatch(updateFromServer('transforms', {
        id: 1,
        contiguous_rows_processed: 3,
        num_transform_errors: 1
      }));

      store.dispatch(updateFromServer('transforms', {
        id: 2,
        contiguous_rows_processed: 3,
        num_transform_errors: 42
      }));

      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(_.map(element.querySelectorAll('.col-name'), 'innerText')).to.eql(['arrest', 'block']);
      expect(_.map(element.querySelectorAll('select'), 'value')).to.eql(['SoQLText', 'SoQLText']);
      expect(_.map(element.querySelectorAll('.column-status-text'), 'innerText')).to.eql([
        '1' + SubI18n.error_exists_scanning,
        '42' + SubI18n.errors_exist_scanning
      ]);
      expect(_.map(element.querySelectorAll('.col-errors .flyout'), 'innerText')).to.eql([
        SubI18n.column_status_flyout.error_msg_singular.format({
          num_errors: 1,
          type: 'Text'
        }) + '\n' + SubI18n.column_status_flyout.click_to_view,
        SubI18n.column_status_flyout.error_msg_plural.format({
          num_errors: 42,
          type: 'Text'
        }) + '\n' + SubI18n.column_status_flyout.click_to_view
      ]);
    });

  });

  // TODO: test error count toggled state (here or column status?)

  describe('total row count', () => {

    it('shows the row count before the file has finished uploading', () => {
      const store = getStoreWithOutputSchema();
      store.dispatch(updateFromServer('transforms', {
        id: 1,
        contiguous_rows_processed: 2
      }));
      store.dispatch(updateFromServer('transforms', {
        id: 2,
        contiguous_rows_processed: 3
      }));
      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(element.querySelector('.total-row-count').innerText).to.eql('2');
    });

    it('shows the row count before the file has finished uploading', () => {
      const store = getStoreWithOutputSchema();
      store.dispatch(updateFromServer('input_schemas', {
        id: 4,
        total_rows: 50
      }));
      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(element.querySelector('.total-row-count').innerText).to.eql('50');
    });

  });

  describe('"apply update" button', () => {

    it('is disabled when the upload is in progress', () => {
      const store = getStoreWithOutputSchema();
      store.dispatch(updateFromServer('transforms', {
        id: 1,
        contiguous_rows_processed: 2
      }));
      store.dispatch(updateFromServer('transforms', {
        id: 2,
        contiguous_rows_processed: 3
      }));
      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(element.querySelector('.btn.apply-update').disabled).to.be.true;
    });

    it('is disabled when the upload is done but not all columns have caught up', () => {
      const store = getStoreWithOutputSchema();
      store.dispatch(updateFromServer('input_schemas', {
        id: 4,
        total_rows: 50
      }));
      store.dispatch(updateFromServer('transforms', {
        id: 1,
        contiguous_rows_processed: 2
      }));
      store.dispatch(updateFromServer('transforms', {
        id: 2,
        contiguous_rows_processed: 3
      }));
      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(element.querySelector('.btn.apply-update').disabled).to.be.true;
    });

    it('is enabled when the upload is done and all columns have caught up', () => {
      const store = getStoreWithOutputSchema();
      store.dispatch(updateFromServer('input_schemas', {
        id: 4,
        total_rows: 50
      }));
      store.dispatch(updateFromServer('transforms', {
        id: 1,
        contiguous_rows_processed: 50
      }));
      store.dispatch(updateFromServer('transforms', {
        id: 2,
        contiguous_rows_processed: 50
      }));
      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(element.querySelector('.btn.apply-update').disabled).to.be.false;
    });

  });

  describe('ReadyToImport indicator', () => {

    it('isn\'t shown when the file is still transforming', () => {
      const store = getStoreWithOutputSchema();
      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(element.querySelector('.ready-to-import')).to.be.null;
    });

    it('is shown when the file is done transforming', () => {
      const store = getStoreWithOutputSchema();
      store.dispatch(updateFromServer('input_schemas', {
        id: 4,
        total_rows: 42
      }));
      store.dispatch(updateFromServer('output_schemas', {
        id: 18,
        error_count: 3
      }));
      store.dispatch(updateFromServer('transforms', {
        id: 1,
        contiguous_rows_processed: 42
      }));
      store.dispatch(updateFromServer('transforms', {
        id: 2,
        contiguous_rows_processed: 42
      }));
      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(element.querySelector('.ready-to-import')).to.not.be.null;
      const paragraphs = element.querySelectorAll('.ready-to-import p');
      expect(paragraphs[0].innerText).to.eql('Ready to import 39 rows');
      expect(paragraphs[1].innerText).to.eql('Rows that will not be imported 3');
    });

  });

});
