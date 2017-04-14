import sinon from 'sinon';
import { expect, assert } from 'chai';
/* eslint new-cap: 0 */
import _ from 'lodash';
import { ManageMetadata } from 'components/ManageMetadata';
import React from 'react';
import { mount, shallow, render } from 'enzyme';
import { statusSavedOnServer, STATUS_SAVED_ON_SERVER, statusDirty } from 'lib/database/statuses';


describe('components/ManageMetadata', () => {
  const datasetPath = 'metadata/dataset';
  const columnPath = 'metadata/columns';

  const defaultProps = {
    views: {
      'hehe-hehe': {
        __status__: statusSavedOnServer,
        id: 'hehe-hehe',
        name: 'a name',
        description: 'a description',
        category: 'category',
        tags: ['a tag'],
        rowLabel: 'row label',
        isDirty: {
          form: false
        }
      }
    },
    fourfour: 'hehe-hehe',
    history: [
      {
        pathname: '/dataset/kjkjkjk/8ftf-gp92/updates/0/uploads/244/schemas/1732/output/355',
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
    onEditColumnMetadata: _.noop,
    outputColumns: [],
    outputSchema: {
      __status__: { type: STATUS_SAVED_ON_SERVER }
    }
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
    const component = renderComponentWithStore(ManageMetadata, defaultDatasetProps);
    assert.ok(component);
  });

  it('renders column metadata tab without errors', () => {
    const columnMeta = renderComponentWithStore(ManageMetadata, defaultColumnProps);
    assert.ok(columnMeta);
  });

  it('renders a title', () => {
    const datasetMeta = renderComponentWithStore(ManageMetadata, defaultDatasetProps);
    expect(datasetMeta.innerText).to.contain(I18n.home_pane.metadata);

    const columnMeta = renderComponentWithStore(ManageMetadata, defaultColumnProps);
    expect(columnMeta.innerText).to.contain(I18n.home_pane.metadata);
  });

  describe('onDismiss handling', () => {
    let datasetStub;
    let datasetMeta;
    let columnStub;
    let columnMeta;

    beforeEach(() => {
      datasetStub = sinon.stub();
      datasetMeta = renderComponentWithStore(ManageMetadata, {
        ...defaultDatasetProps,
        onDismiss: datasetStub
      });

      columnStub = sinon.stub();
      columnMeta = renderComponentWithStore(ManageMetadata, {
        ...defaultDatasetProps,
        onDismiss: columnStub
      });
    });

    it('is invoked when you click cancel', () => {
      TestUtils.Simulate.click(datasetMeta.querySelector('#cancel'));
      expect(datasetStub.called).to.eq(true);

      TestUtils.Simulate.click(columnMeta.querySelector('#cancel'));
      expect(columnStub.called).to.eq(true);
    });

    it('is invoked when you click the x', () => {
      TestUtils.Simulate.click(datasetMeta.querySelector('.modal-header-dismiss'));
      expect(datasetStub.called).to.eq(true);

      TestUtils.Simulate.click(columnMeta.querySelector('.modal-header-dismiss'));
      expect(columnStub.called).to.eq(true);
    });
  });

  describe('onSave handling', () => {
    // rather than test save funcitonality here, just test that it passes the correct
    // data; test saving behavior in SaveButton tests
    it('passes the correct prop to SaveButton when form isn\'t dirty', () => {
      const component = shallow(<ManageMetadata {...defaultDatasetProps}/>);

      expect(component.find('SaveButton').props().isDirty).to.eq(false);
    });

    it('passes the correct prop to SaveButton when form is dirty', () => {
      const dirtyView = {
        ...defaultProps.views[defaultProps.fourfour],
        isDirty: {
          form: true
        }
      };

      const dirtyProps = {
        ...defaultDatasetProps,
        views: {
          [defaultProps.fourfour]: dirtyView
        }
      };

      const component = shallow(<ManageMetadata {...dirtyProps} />);

      expect(component.find('SaveButton').props().isDirty).to.eq(true);
    });
  });
});
