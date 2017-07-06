import { expect, assert } from 'chai';
import { ManageMetadata } from 'components/ManageMetadata';
import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reducers/rootReducer';
import initialState from '../../data/initialState';
import thunk from 'redux-thunk';
import { shallow } from 'enzyme';

describe('components/ManageMetadata', () => {
  const datasetPath = 'metadata/dataset';
  const columnPath = 'metadata/columns';
  const store = createStore(reducer, initialState, applyMiddleware(thunk));

  const defaultProps = {
    view: {
      id: 'hehe-hehe',
      name: 'a name',
      description: 'a description',
      category: 'category',
      tags: ['a tag'],
      rowLabel: 'row label',
      datasetFormDirty: false,
      columnFormDirty: false
    },
    fourfour: 'hehe-hehe',
    history: [
      {
        pathname:
          '/dataset/kjkjkjk/8ftf-gp92/revisions/0/uploads/244/schemas/1732/output/355',
        search: '',
        hash: '',
        action: 'POP',
        key: 'rr69kr',
        query: {}
      }
    ],
    currentColumns: {},
    columnsExist: true
  };

  const defaultDatasetProps = {
    ...defaultProps,
    path: datasetPath
  };

  const defaultColumnProps = {
    ...defaultProps,
    path: columnPath
  };

  it('renders dataset metadata tab without errors', () => {
    const component = renderComponentWithStore(
      ManageMetadata,
      defaultDatasetProps,
      store
    );
    assert.ok(component);
  });

  it('renders column metadata tab without errors', () => {
    const columnMeta = renderComponentWithStore(
      ManageMetadata,
      defaultColumnProps,
      store
    );
    assert.ok(columnMeta);
  });

  it('renders a title', () => {
    const datasetMeta = renderComponentWithStore(
      ManageMetadata,
      defaultDatasetProps,
      store
    );
    expect(datasetMeta.innerText).to.contain(I18n.home_pane.metadata);

    const columnMeta = renderComponentWithStore(
      ManageMetadata,
      defaultColumnProps,
      store
    );
    expect(columnMeta.innerText).to.contain(I18n.home_pane.metadata);
  });

  describe('onSave handling', () => {
    it('renders a disabled button if the form is not dirty', () => {
      const component = shallow(<ManageMetadata {...defaultDatasetProps} />);
      const isDisabled = component
        .find('Connect(ApiCallButton)')
        .prop('forceDisable');
      assert.isTrue(isDisabled);
    });

    it('renders an enabled button if the form is dirty', () => {
      const newProps = {
        ...defaultDatasetProps,
        view: {
          ...defaultDatasetProps.view,
          datasetFormDirty: true,
          columnFormDirty: true
        }
      };

      const component = shallow(<ManageMetadata {...newProps} />);
      const isDisabled = component
        .find('Connect(ApiCallButton)')
        .prop('forceDisable');
      assert.isFalse(isDisabled);
    });

    it('renders a button that saves column metadata when not on dataset path', () => {
      const newProps = {
        ...defaultColumnProps,
        view: {
          ...defaultDatasetProps.view,
          datasetFormDirty: true,
          columnFormDirty: true
        }
      };

      const component = shallow(<ManageMetadata {...newProps} />);

      const operation = component
        .find('Connect(ApiCallButton)')
        .prop('operation');

      assert.equal(operation, 'SAVE_COLUMN_METADATA');
    });

    it('renders a button that saves dataset metadata when on the dataset path', () => {
      const newProps = {
        ...defaultDatasetProps,
        view: {
          ...defaultDatasetProps.view,
          datasetFormDirty: true,
          columnFormDirty: true
        }
      };

      const component = shallow(<ManageMetadata {...newProps} />);

      const operation = component
        .find('Connect(ApiCallButton)')
        .prop('operation');

      assert.equal(operation, 'SAVE_DATASET_METADATA');
    });
  });
});
