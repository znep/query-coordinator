import { assert } from 'chai';
import { shallow } from 'enzyme';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reducers/rootReducer';
import initialState from '../../data/initialState';
import thunk from 'redux-thunk';
import TestUtils from 'react-addons-test-utils';
import React from 'react';
import DatasetFormConnected, {
  DatasetForm
} from 'components/Forms/DatasetForm';

describe('components/ManageMetadata/DatasetForm', () => {
  const newState = Object.assign({}, initialState);

  newState.entities.views['kg5j-unyr'].customMetadataFields = [
    {
      name: 'Cat Fieldset',
      fields: [
        {
          name: 'name',
          required: false
        },
        {
          name: 'age(cat years)',
          required: false
        },
        {
          name: 'meow?',
          required: false
        }
      ]
    }
  ];

  const store = createStore(reducer, newState, applyMiddleware(thunk));

  const defaultProps = {
    fourfour: 'kg5j-unyr',
    syncToStore: () => {},
    model: {}
  };

  it('renders correctly', () => {
    const component = shallow(<DatasetForm {...defaultProps} />);

    assert.lengthOf(component.find('form'), 1);
    assert.lengthOf(component.find('Fieldset'), 4);
    assert.lengthOf(component.find('[name="email"]'), 1);
    assert.lengthOf(component.find('[name="name"]'), 1);
    assert.lengthOf(component.find('[name="category"]'), 1);
    assert.lengthOf(component.find('[name="description"]'), 1);
    assert.lengthOf(component.find('[name="tag"]'), 1);
  });

  it("syncs it's local state to store", () => {
    const component = renderComponentWithStore(DatasetFormConnected, {}, store);

    const inputField = component.querySelector('#name');

    inputField.value = 'testing!!!';

    TestUtils.Simulate.change(inputField, { target: inputField });

    assert.equal(
      store.getState().entities.views['kg5j-unyr'].model['name'],
      'testing!!!'
    );
  });

  it('renders custom fieldset and fields', () => {
    const component = renderComponentWithStore(DatasetFormConnected, {}, store);

    const legends = [...component.querySelectorAll('legend')];

    const customLegend = legends.filter(
      legend =>
        legend.textContent ===
        newState.entities.views['kg5j-unyr'].customMetadataFields[0].name
    );

    const inputs = [...customLegend[0].parentNode.children]
      .filter(child => child.nodeName.toUpperCase() === 'DIV')
      .map(div => [...div.children])
      .reduce((acc, childList) => acc.concat(childList), [])
      .filter(child => child.nodeName.toUpperCase() === 'INPUT');

    assert.lengthOf(customLegend, 1);

    assert.lengthOf(inputs, 3);
  });
});
