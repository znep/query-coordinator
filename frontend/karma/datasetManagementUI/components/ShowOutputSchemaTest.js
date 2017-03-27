import _ from 'lodash';
import { Simulate } from 'react-addons-test-utils';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import ShowOutputSchema from 'components/ShowOutputSchema';
import { ShowOutputSchema as ShowOutputSchemaUnConnected } from 'components/ShowOutputSchema';
import * as Selectors from 'selectors';
import {
  insertFromServer, insertMultipleFromServer, updateFromServer, batch
} from 'actions/database';

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
    expect(_.map(element.querySelectorAll('.colName'), 'innerText')).to.eql(['arrest', 'block']);
    expect(_.map(element.querySelectorAll('select'), 'value')).to.eql(['SoQLText', 'SoQLText']);
    expect(_.map(element.querySelectorAll('.colErrors'), 'innerText')).to.eql([
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
    store.dispatch(insertMultipleFromServer('transform_1', [
      { id: 0, ok: 'foo' },
      { id: 1, error: { message: 'some transform error', inputs: { arrest: { ok: 'bar' } } } },
      { id: 2, ok: 'baz' }
    ]));
    store.dispatch(updateFromServer('transforms', {
      id: 1,
      contiguous_rows_processed: 3
    }));

    store.dispatch(insertMultipleFromServer('transform_2', [
      { id: 0, ok: 'bleep' },
      { id: 1, ok: null },
      { id: 2, ok: 'blorp' }
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
    expect(_.map(element.querySelectorAll('.colErrors'), 'innerText')).to.eql([
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
      upload: _.values(storeDb.uploads)[0],
      inputSchema: _.values(storeDb.input_schemas)[0],
      outputSchema: _.values(storeDb.output_schemas)[0],
      columns: Selectors.columnsForOutputSchema(storeDb, _.values(storeDb.output_schemas)[0].id),
      canApplyUpdate: false,
      updateColumnType: spy,
      goHome: _.noop,
      goToUpload: _.noop,
      applyUpdate: _.noop
    };
    const element = renderPureComponent(ShowOutputSchemaUnConnected(props));
    const firstSelect = element.querySelector('select');
    firstSelect.value = 'SoQLNumber';
    Simulate.change(firstSelect);
    expect(spy.callCount).to.eql(1);

    const [calledWithOutputSchema, calledWithOutputColumn, calledWithUpdatedType] = spy.args[0];

    expect(calledWithOutputSchema.id).to.eql(_.values(storeDb.output_schemas)[0].id);
    expect(calledWithOutputColumn.id).to.eql(_.values(storeDb.output_columns)[0].id);
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
      expect(_.map(element.querySelectorAll('.colName'), 'innerText')).to.eql(['arrest', 'block']);
      expect(_.map(element.querySelectorAll('select'), 'value')).to.eql(['SoQLText', 'SoQLText']);
      expect(_.map(element.querySelectorAll('.statusText'), 'innerText')).to.eql([
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
      expect(_.map(element.querySelectorAll('.colName'), 'innerText')).to.eql(['arrest', 'block']);
      expect(_.map(element.querySelectorAll('select'), 'value')).to.eql(['SoQLText', 'SoQLText']);
      expect(_.map(element.querySelectorAll('.statusText'), 'innerText')).to.eql([
        '1' + SubI18n.error_exists_scanning,
        '42' + SubI18n.errors_exist_scanning
      ]);
      expect(_.map(element.querySelectorAll('.colErrors .flyout'), 'innerText')).to.eql([
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
      expect(element.querySelector('.attribute').innerText).to.eql('2');
    });

    it('shows the row count before the file has finished uploading', () => {
      const store = getStoreWithOutputSchema();
      store.dispatch(updateFromServer('input_schemas', {
        id: 4,
        total_rows: 50
      }));
      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(element.querySelector('.attribute').innerText).to.eql('50');
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
      expect(element.querySelector('.processBtn').disabled).to.be.true;
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
      expect(element.querySelector('.processBtn').disabled).to.be.true;
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
      expect(element.querySelector('.processBtn').disabled).to.be.false;
    });

  });

  describe('ReadyToImport indicator', () => {

    it('isn\'t shown when the file is still transforming', () => {
      const store = getStoreWithOutputSchema();
      const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
      expect(element.querySelector('.readyToImport')).to.be.null;
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
      expect(element.querySelector('.readyToImport')).to.not.be.null;
      const paragraphs = element.querySelectorAll('.readyToImport p');
      expect(paragraphs[0].innerText).to.eql('Ready to import 39 rows');
      expect(paragraphs[1].innerText).to.eql('Rows that will not be imported 3');
    });

    describe('export errors button', () => {

      it('is enabled and has the correct link when there are errors', () => {
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
        const exportButton = element.querySelector('.errorsBtn');
        expect(exportButton.parentNode.href.endsWith('/api/publishing/v1/upload/5/schema/4/errors/18')).to.be.true;
        expect(exportButton).to.not.be.null;
        expect(exportButton.disabled).to.be.false;
      });

      it('is greyed out when there are no errors', () => {
        const store = getStoreWithOutputSchema();
        store.dispatch(updateFromServer('input_schemas', {
          id: 4,
          total_rows: 42
        }));
        store.dispatch(updateFromServer('output_schemas', {
          id: 18,
          error_count: 0
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
        const exportButton = element.querySelector('.errorsBtn');
        expect(exportButton).to.not.be.null;
        expect(exportButton.disabled).to.be.true;
      });

    });

  });

});
