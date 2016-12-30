import _ from 'lodash';
import { Simulate } from 'react-addons-test-utils';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import ShowOutputSchema from 'components/ShowOutputSchema';
import { ShowOutputSchema as ShowOutputSchemaUnConnected } from 'components/ShowOutputSchema';
import { insertFromServer, batch } from 'actions/database';
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
    expect(_.map(element.querySelectorAll('.dropdown-selected'), 'innerText')).to.eql(['Text', 'Text']);
  });

  it('renders a table with data', () => {
    const store = getStoreWithOutputSchema();
    store.dispatch(batch(['foo', 'bar', 'baz'].map((value, index) => (
      insertFromServer('column_50', { value, id: index })
    ))));
    store.dispatch(batch(['bleep', 'bloop', 'blorp'].map((value, index) => (
      insertFromServer('column_51', { value, id: index })
    ))));
    const element = renderComponentWithStore(ShowOutputSchema, defaultProps, store);
    const rows = element.querySelectorAll('tbody tr');
    expect(_.map(rows[0].querySelectorAll('td'), 'innerText')).to.eql(['foo', 'bleep']);
    expect(_.map(rows[1].querySelectorAll('td'), 'innerText')).to.eql(['bar', 'bloop']);
    expect(_.map(rows[2].querySelectorAll('td'), 'innerText')).to.eql(['baz', 'blorp']);
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

});
