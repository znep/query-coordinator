import { expect, assert } from 'chai';
import { shallow } from 'enzyme';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reducers';
import initialState from '../../data/initialState';
import thunk from 'redux-thunk';

import ColumnFormConnected, { ColumnForm } from 'components/ManageMetadata/ColumnForm';

describe('components/ManageMetadata/ColumnForm', () => {
  const store = createStore(reducer, initialState, applyMiddleware(thunk));

  const defaultProps = {
    currentColumns: [
      {
        'position': 0,
        'id': 6329,
        'field_name': 'mkkk',
        'display_name': 'IDs',
        'description': null,
        'transform_id': 6105,
        '__status__': {
          'type': 'SAVED',
          'savedAt': 'ON_SERVER'
        },
        'transform': {
          'transform_expr': 'to_number(`id`)',
          'output_soql_type': 'SoQLNumber',
          'id': 6105,
          'completed_at': '2017-04-03T15:49:34',
          '__status__': {
            'type': 'SAVED',
            'savedAt': 'ON_SERVER'
          },
          'row_fetch_started': true,
          'contiguous_rows_processed': 423223,
          'fetched_rows': 200
        }
      },
      {
        'position': 1,
        'id': 6328,
        'field_name': 'case_number',
        'display_name': 'Case Number',
        'description': null,
        'transform_id': 6106,
        '__status__': {
          'type': 'SAVED',
          'savedAt': 'ON_SERVER'
        },
        'transform': {
          'transform_expr': '`case_number`',
          'output_soql_type': 'SoQLText',
          'id': 6106,
          'completed_at': '2017-04-03T15:49:34',
          '__status__': {
            'type': 'SAVED',
            'savedAt': 'ON_SERVER'
          },
          'row_fetch_started': true,
          'contiguous_rows_processed': 423223,
          'fetched_rows': 200
        }
      }
    ],
    fourfour: '3kt9-pmvq'
  };

  it('renders correctly', () => {
    const component = shallow(<ColumnForm {...defaultProps}/>);
    expect(component.find('form')).to.have.length(1);
    expect(component.find('Fieldset')).to.have.length(1);
    expect(component.find('.row')).to.have.length(2);
    expect(component.find('MetadataField')).to.have.length(6);
    expect(component
      .find('MetadataField')
      .map(field => field.prop('type'))
      .filter(type => type === 'text')).to.have.length(6);
  });

  it('syncs it\'s local state to store', () => {
    const component = renderComponentWithStore(ColumnFormConnected, {}, store);
    const inputField = component.querySelector('#display-name-6263');
    inputField.value = 'testing!!!'
    TestUtils.Simulate.change(inputField, { target: inputField });
    expect(store
      .getState()
      .db.views['3kt9-pmvq']
      .colFormModel['display-name-6263']).to.eq('testing!!!');
  });
});
