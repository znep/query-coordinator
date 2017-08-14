import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import DatasetFormConnected from 'containers/DatasetFormContainer';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reduxStuff/reducers/rootReducer';
import initialState from '../data/initialState';
import thunk from 'redux-thunk';

describe('containers/DatasetFormContainer', () => {
  const newState = Object.assign({}, initialState);

  const customFieldsets = [
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

  newState.entities.views[
    'kg5j-unyr'
  ].customMetadataFieldsets = customFieldsets;

  const testStore = createStore(reducer, newState, applyMiddleware(thunk));

  const testParams = {
    category: 'dataset',
    name: 'dfsdfdsf',
    fourfour: 'kg5j-unyr',
    revisionSeq: '0',
    sourceId: '115',
    inputSchemaId: '98',
    outputSchemaId: '144'
  };

  it('updates values in store', () => {
    const component = mount(<DatasetFormConnected outputSchemaId={144} />, {
      context: {
        store: testStore,
        router: {
          params: testParams,
          push: () => {},
          replace: () => {},
          go: () => {},
          goBack: () => {},
          goForward: () => {},
          createHref: () => {},
          createPath: () => {},
          setRouteLeaveHook: () => {},
          isActive: () => {}
        }
      },
      childContextTypes: {
        store: React.PropTypes.object
      }
    });

    component
      .find('#name')
      .first()
      .simulate('change', { target: { value: 'hey' } });

    assert.equal(testStore.getState().entities.views['kg5j-unyr'].name, 'hey');
  });

  it('renders custom fieldset and fields', () => {
    const component = mount(<DatasetFormConnected outputSchemaId={144} />, {
      context: {
        store: testStore,
        router: {
          params: testParams,
          push: () => {},
          replace: () => {},
          go: () => {},
          goBack: () => {},
          goForward: () => {},
          createHref: () => {},
          createPath: () => {},
          setRouteLeaveHook: () => {},
          isActive: () => {}
        }
      },
      childContextTypes: {
        store: React.PropTypes.object
      }
    });

    const legends = component.find('legend');

    const customLegends = legends.filterWhere(
      legend => legend.text() === customFieldsets[0].name
    );

    assert.lengthOf(customLegends, 1);
  });
});
