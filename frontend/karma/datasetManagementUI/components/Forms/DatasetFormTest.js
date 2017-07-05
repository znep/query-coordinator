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

describe('components/Forms/DatasetForm', () => {
  const newState = Object.assign({}, initialState);

  newState.entities.views['kg5j-unyr'].customMetadataFieldsets = [
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
    regularFieldsets: [
      {
        title: 'Title and Description',
        subtitle:
          'Make your title and description as clear and simple as possible.',
        fields: [
          {
            name: 'name',
            label: 'Dataset Title',
            value: 'ddd',
            isPrivate: false,
            isRequired: true,
            placeholder: 'Dataset Title',
            isCustom: false
          },
          {
            name: 'description',
            label: 'Brief Description',
            value: 'kk',
            isPrivate: false,
            isRequired: false,
            placeholder: 'Enter a description'
          }
        ]
      }
    ],
    customFieldsets: [
      {
        title: 'FS One',
        subtitle: null,
        fields: [
          {
            name: 'name',
            label: 'name',
            value: null,
            isRequired: false,
            placeholder: null,
            isCustom: true
          }
        ]
      }
    ],
    setErrors: () => {}
  };

  it('renders correctly', () => {
    const component = shallow(<DatasetForm {...defaultProps} />);
    assert.lengthOf(component.find('form'), 1);
    assert.lengthOf(component.find('Fieldset'), 2);
    assert.lengthOf(component.find('Connect(Field)'), 3);
  });

  it('updates values in store', () => {
    const component = renderComponentWithStore(DatasetFormConnected, {}, store);

    const inputField = component.querySelector('#name');

    inputField.value = 'testing!!!';

    TestUtils.Simulate.change(inputField, { target: inputField });

    assert.equal(
      store.getState().entities.views['kg5j-unyr'].name,
      'testing!!!'
    );
  });

  it('renders custom fieldset and fields', () => {
    const component = renderComponentWithStore(DatasetFormConnected, {}, store);
    const legends = [...component.querySelectorAll('legend')];

    const customLegend = legends.filter(
      legend =>
        legend.textContent ===
        newState.entities.views['kg5j-unyr'].customMetadataFieldsets[0].name
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
