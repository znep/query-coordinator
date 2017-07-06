import sinon from 'sinon';
import { expect, assert } from 'chai';
import _ from 'lodash';
import { ManageMetadata } from 'components/ManageMetadata';
import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reducers/rootReducer';
import initialState from '../../data/initialState';
import thunk from 'redux-thunk';
import { mount, shallow, render } from 'enzyme';
import TestUtils from 'react-addons-test-utils';

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
      isDirty: {
        form: false
      }
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
    onChange: _.noop,
    onSaveDataset: _.noop,
    onSaveCol: _.noop,
    onDismiss: _.noop,
    onCancel: _.noop,
    onEditColumnMetadata: _.noop,
    outputColumns: [],
    currentColumns: [],
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

  describe('onDismiss handling', () => {
    let datasetStub;
    let datasetMeta;
    let columnStub;
    let columnMeta;

    beforeEach(() => {
      datasetStub = sinon.stub();
      datasetMeta = renderComponentWithStore(
        ManageMetadata,
        {
          ...defaultDatasetProps,
          onDismiss: datasetStub
        },
        store
      );

      columnStub = sinon.stub();
      columnMeta = renderComponentWithStore(
        ManageMetadata,
        {
          ...defaultColumnProps,
          onDismiss: columnStub
        },
        store
      );
    });

    it('is invoked when you click the x', () => {
      TestUtils.Simulate.click(
        datasetMeta.querySelector('.modal-header-dismiss')
      );
      expect(datasetStub.called).to.eq(true);

      TestUtils.Simulate.click(
        columnMeta.querySelector('.modal-header-dismiss')
      );
      expect(columnStub.called).to.eq(true);
    });
  });

  describe('onSave handling', () => {
    function distinguishableNoop1() {}
    function distinguishableNoop2() {}

    const props = {
      ...defaultDatasetProps,
      onDismiss: distinguishableNoop1,
      onSaveDataset: distinguishableNoop2
    };

    // rather than test save funcitonality here, just test that it passes the correct
    // data; test saving behavior in ApiCallButton tests
    it("passes the correct prop to SaveButton when form isn't dirty", () => {
      const component = shallow(<ManageMetadata {...props} />);

      assert.equal(
        component.find('Connect(ApiCallButton)').props().onClick,
        props.onDismiss
      );
    });

    it('passes the correct prop to ApiCallButton when form is dirty', () => {
      const dirtyView = {
        ...defaultProps.views[defaultProps.fourfour],
        isDirty: {
          form: true
        }
      };

      const dirtyProps = {
        ...props,
        views: {
          [defaultProps.fourfour]: dirtyView
        }
      };

      const component = shallow(<ManageMetadata {...dirtyProps} />);

      assert.equal(
        component.find('Connect(ApiCallButton)').props().onClick,
        props.onSaveDataset
      );
    });
  });
});
