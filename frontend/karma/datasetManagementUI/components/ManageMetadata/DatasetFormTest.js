import { expect, assert } from 'chai';
import { shallow } from 'enzyme';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reducers';
import initialState from '../../data/initialState';
import thunk from 'redux-thunk';

import DatasetFormConnected, { DatasetForm } from 'components/ManageMetadata/DatasetForm';

describe('components/ManageMetadata/DatasetForm', () => {
  const store = createStore(reducer, initialState, applyMiddleware(thunk));

  const defaultProps = {
    fourfour: '3kt9-pmvq'
  };

  it('renders correctly', () => {
    const component = shallow(<DatasetForm {...defaultProps}/>);
    expect(component.find('form')).to.have.length(1);
    expect(component.find('Fieldset')).to.have.length(4);
    expect(component.find('MetadataField[name="email"]')).to.have.length(1);
    expect(component.find('MetadataField[name="name"]')).to.have.length(1);
    expect(component.find('MetadataField[name="category"]')).to.have.length(1);
    expect(component.find('MetadataField[name="description"]')).to.have.length(1);
    expect(component.find('MetadataField[name="tag"]')).to.have.length(1);
  });

  it('syncs it\'s local state to store', () => {
    const component = renderComponentWithStore(DatasetFormConnected, {}, store);
    const inputField = component.querySelector('#name');
    inputField.value = 'testing!!!'
    TestUtils.Simulate.change(inputField, { target: inputField });
    expect(store
      .getState()
      .db.views['3kt9-pmvq']
      .model['name']).to.eq('testing!!!');
  });
});
