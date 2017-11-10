import { assert } from 'chai';
import { TransformStatus } from 'components/TransformStatus/TransformStatus'; // eslint-disable-line no-unused-vars
import { normal } from 'lib/displayState';
import { shallow } from 'enzyme';
import React from 'react';

describe('components/TransformStatus', () => {
  const defaultProps = {
    path: {
      sourceId: 0,
      inputSchemaId: 0,
      outputSchemaId: 0
    },
    displayState: normal(1, 382),
    isIgnored: false,
    params: {
      category: 'dataset',
      name: 'dfsdfdsf',
      fourfour: 'kg5j-unyr',
      revisionSeq: '0',
      sourceId: '0',
      inputSchemaId: '0',
      outputSchemaId: '0'
    },
    flyouts: false,
    onClickError: _.noop,
    shortcuts: [],
    showShortcut: false,
    columnId: 50,
    totalRows: 5000,
    transform: {
      completed_at: '2017-11-10T18:48:31.893Z',
      output_soql_type: 'text',
      contiguous_rows_processed: 5000
    }
  };

  describe('when there are no errors', () => {
    it('renders correctly when source is done and column is done', () => {
      const component = shallow(<TransformStatus {...defaultProps} />);
      assert.isAtLeast(component.find('ProgressBar').length, 1);
      assert.equal(
        component.find('StatusText').prop('message'),
        I18n.show_output_schema.column_header.no_errors_exist
      );
    });

    it('renders correctly when source is done and column is in progress', () => {
      const props = {
        ...defaultProps,
        transform: {
          output_soql_type: 'text',
          contiguous_rows_processed: 2500
        }
      };

      const component = shallow(<TransformStatus {...props} />);

      assert.equal(component.find('ProgressBar').prop('percent'), 50);

      assert.equal(
        component.find('StatusText').prop('message'),
        I18n.show_output_schema.column_header.scanning
      );
    });

    it('has a failedColumn class when the transform has a failed_at', () => {
      const props = {
        ...defaultProps,
        transform: {
          failed_at: new Date()
        }
      };

      const component = shallow(<TransformStatus {...props} />);

      assert.isTrue(component.hasClass('failedColumn'));
    });

    it('renders correctly when source is in progress, column is in progress', () => {
      const props = {
        ...defaultProps,
        transform: {
          output_soql_type: 'text',
          contiguous_rows_processed: 2500
        },
        totalRows: undefined
      };

      const component = shallow(<TransformStatus {...props} />);

      assert.equal(
        component.find('StatusText').prop('message'),
        I18n.show_output_schema.column_header.scanning
      );
    });

    it('renders correctly when neither source progress nor column progress is known', () => {
      const props = {
        ...defaultProps,
        transform: {
          output_soql_type: 'text',
          contiguous_rows_processed: 0,
          id: 5
        },
        totalRows: undefined
      };

      const component = shallow(<TransformStatus {...props} />);

      assert.equal(
        component.find('StatusText').prop('message'),
        I18n.show_output_schema.column_header.scanning
      );
    });
  });

  describe('when there are errors', () => {
    it('renders correctly when source is done and column is done', () => {
      const props = {
        ...defaultProps,
        transform: {
          output_soql_type: 'text',
          contiguous_rows_processed: 5000,
          error_count: 5
        }
      };

      const component = shallow(<TransformStatus {...props} />);

      assert.isAtLeast(component.find('ErrorPill').length, 1);

      assert.equal(component.find('ErrorPill').prop('number'), 5);
    });

    it('renders correctly when source is done and column is in progress', () => {
      const props = {
        ...defaultProps,
        transform: {
          output_soql_type: 'text',
          contiguous_rows_processed: 2500,
          error_count: 5
        }
      };

      const component = shallow(<TransformStatus {...props} />);

      assert.equal(component.find('ProgressBar').prop('percent'), 50);

      assert.isAtLeast(component.find('ErrorPill').length, 1);

      assert.isAtLeast(component.find('ErrorFlyout').length, 1);
    });

    it('renders correctly when source is in progress, column is in progress', () => {
      const props = {
        ...defaultProps,
        transform: {
          output_soql_type: 'text',
          contiguous_rows_processed: 2500,
          error_count: 5
        },
        totalRows: null
      };

      const component = shallow(<TransformStatus {...props} />);

      assert.include(component.text(), '<ProgressBar />');
      assert.include(component.text(), '<ErrorFlyout />');
      assert.include(component.text(), '<Link />');
    });
  });
});
