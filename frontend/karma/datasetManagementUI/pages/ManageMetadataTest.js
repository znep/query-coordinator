import { assert } from 'chai';
import { ManageMetadata } from 'pages/ManageMetadata/ManageMetadata';
import React from 'react';
import { shallow } from 'enzyme';

describe('ManageMetadata page', () => {
  const datasetPath = 'metadata/dataset';
  const columnPath = 'metadata/columns';

  const defaultProps = {
    revision: {
      metadata: {
        id: 'hehe-hehe',
        name: 'a name',
        description: 'a description',
        category: 'category',
        tags: ['a tag'],
        rowLabel: 'row label'
      }
    },
    fourfour: 'hehe-hehe',
    history: [
      {
        pathname:
          '/dataset/kjkjkjk/8ftf-gp92/revisions/0/sources/244/schemas/1732/output/355',
        search: '',
        hash: '',
        action: 'POP',
        key: 'rr69kr',
        query: {}
      }
    ],
    currentColumns: {},
    columnsExist: true,
    dispatch: () => {},
    entities: {},
    location: {},
    outputSchemaId: 86,
    datasetFormDirty: false,
    columnFormDirty: false,
    params: {}
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
    const component = shallow(<ManageMetadata {...defaultDatasetProps} />);
    assert.ok(component);
  });

  it('renders column metadata tab without errors', () => {
    const component = shallow(<ManageMetadata {...defaultColumnProps} />);

    assert.ok(component);
  });

  it('renders a title', () => {
    const datasetComponent = shallow(
      <ManageMetadata {...defaultDatasetProps} />
    );

    const datasetTitle = datasetComponent.find('Header').prop('title');

    assert.include(datasetTitle, I18n.home_pane.metadata);

    const columnComponent = shallow(<ManageMetadata {...defaultColumnProps} />);

    const columnTitle = columnComponent.find('Header').prop('title');

    assert.include(columnTitle, I18n.home_pane.metadata);
  });

  describe('onSave handling', () => {
    it('renders a disabled button if the form is not dirty', () => {
      const component = shallow(<ManageMetadata {...defaultDatasetProps} />);
      const isDisabled = component
        .find('Connect(ApiCallButton)')
        .prop('forceDisable');
      assert.isTrue(isDisabled);
    });

    it('renders a done button if the form is not dirty', () => {
      const newProps = {
        ...defaultDatasetProps,
        datasetFormDirty: false,
        columnFormDirty: false
      };

      const component = shallow(<ManageMetadata {...newProps} />);
      const actualText = component
        .find('#cancel')
        .text();
      assert.equal(actualText, 'Done');
    });

    it('renders a done button if the form is not dirty on columns', () => {
      const newProps = {
        ...defaultColumnProps,
        datasetFormDirty: false,
        columnFormDirty: false
      };

      const component = shallow(<ManageMetadata {...newProps} />);
      const actualText = component
        .find('#cancel')
        .text();
      assert.equal(actualText, 'Done');
    });


    it('renders a cancel button if the column form is dirty', () => {
      const newProps = {
        ...defaultColumnProps,
        datasetFormDirty: false,
        columnFormDirty: true
      };

      const component = shallow(<ManageMetadata {...newProps} />);
      const actualText = component
        .find('#cancel')
        .text();
      assert.equal(actualText, 'Cancel');
    });

    it('renders a cancel button if the form is dirty on columns', () => {
      const newProps = {
        ...defaultColumnProps,
        datasetFormDirty: false,
        columnFormDirty: true
      };

      const component = shallow(<ManageMetadata {...newProps} />);
      const actualText = component
        .find('#cancel')
        .text();
      assert.equal(actualText, 'Cancel');
    });


    it('renders an enabled button if the form is dirty', () => {
      const newProps = {
        ...defaultDatasetProps,
        datasetFormDirty: true,
        columnFormDirty: true
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
