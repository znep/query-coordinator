import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import MetadataContent from 'components/MetadataContent/MetadataContent';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reduxStuff/reducers/rootReducer';
import initialState from '../data/initialState';
import thunk from 'redux-thunk';

describe('components/MetadataContent', () => {
  const defaultProps = {
    path: '/dataset/columns',
    fourfour: 'hehe-hehe',
    currentOutputSchemaId: null,
    onSidebarTabClick: () => {},
    columnsExist: false,
    onDatasetTab: true,
    store: createStore(reducer, initialState, applyMiddleware(thunk)),
    params: {}
  };

  it('shows a disabled columns tab if columnsExist is falsey', () => {
    const component = shallow(<MetadataContent {...defaultProps} />);
    assert.isOk(component.find('.sidebar span.disabled'));
  });

  it('shows an enabled columns tab if columnsExist is truthy', () => {
    const newProps = {
      ...defaultProps,
      columnsExist: true,
      store: createStore(reducer, initialState, applyMiddleware(thunk))
    };

    const component = shallow(<MetadataContent {...newProps} />);
    assert.isNotOk(component.find('Link').last().hasClass('disabled'));
  });
});
