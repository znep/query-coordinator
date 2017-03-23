/* eslint new-cap: 0 */
import _ from 'lodash';
import { ManageMetadata } from 'components/ManageMetadata';
import { statusSavedOnServer, STATUS_SAVED_ON_SERVER, statusDirty } from 'lib/database/statuses';


describe('components/ManageMetadata', () => {
  const datasetPath = 'metadata/dataset';
  const columnPath = 'metadata/columns';

  const defaultProps = {
    view: {
      __status__: statusSavedOnServer,
      id: 'hehe-hehe',
      name: 'a name',
      description: 'a description',
      category: 'category',
      tags: ['a tag'],
      rowLabel: 'row label'
    },
    onChange: _.noop,
    onSave: _.noop,
    onDismiss: _.noop,
    onEditDatasetMetadata: _.noop,
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
    expect(component).to.exist;
  });

  it('renders column metadata tab without errors', () => {
    const columnMeta = renderComponentWithStore(ManageMetadata, defaultColumnProps);
    expect(columnMeta).to.exist;
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
    it('isn\'t invoked when you click save if the view isn\'t dirty', () => {
      const datasetStub = sinon.stub();
      const datasetMeta = renderComponentWithStore(ManageMetadata, {
        ...defaultColumnProps,
        onSave: datasetStub
      });

      TestUtils.Simulate.click(datasetMeta.querySelector('#save'));
      expect(datasetStub.called).to.eq(false);

      const columnStub = sinon.stub();
      const columnMeta = renderComponentWithStore(ManageMetadata, {
        ...defaultColumnProps,
        onSave: columnStub
      });

      TestUtils.Simulate.click(columnMeta.querySelector('#save'));
      expect(columnStub.called).to.eq(false);
    });

    it('is invoked when you click save if the view is dirty', () => {
      const stub = sinon.stub();

      const dirtyView = {
        ...defaultDatasetProps.view,
        __status__: statusDirty(defaultProps.view)
      };

      const propsWithDirtyView = {
        ...defaultDatasetProps,
        view: dirtyView
      };

      const element = renderComponentWithStore(ManageMetadata, {
        ...propsWithDirtyView,
        onSave: stub
      });

      TestUtils.Simulate.click(element.querySelector('#save'));
      expect(stub.called).to.eq(true);
    });

    it('is invoked when you click save if a column is dirty', () => {
      const stub = sinon.stub();

      const oldColumn = {
        name: 'Tiny Hands',
        field_name: 'the_president'
      };

      const propsWithDirtyColumn = {
        ...defaultColumnProps,
        outputColumns: [{
          name: 'Supreme Leader',
          field_name: 'the_president',
          __status__: statusDirty(oldColumn)
        }],
        onSave: stub
      };

      const element = renderComponentWithStore(ManageMetadata, propsWithDirtyColumn);

      TestUtils.Simulate.click(element.querySelector('#save'));
      expect(stub.called).to.eq(true);
    });
  });
});
