import { assert } from 'chai';
import { TransformStatus } from 'components/Table/TransformStatus'; // eslint-disable-line no-unused-vars
import { normal } from 'lib/displayState';
import { shallow } from 'enzyme';
import React from 'react';

describe('components/Table/TransformStatus', () => {
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
    columnId: 50,
    totalRows: 5000,
    transform: {
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
          num_transform_errors: 5
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
          num_transform_errors: 5
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
          num_transform_errors: 5
        },
        totalRows: null
      };

      const component = shallow(<TransformStatus {...props} />);

      assert.equal(component.text(), '<ProgressBar /><Link /><ErrorFlyout />');
    });
  });
});
