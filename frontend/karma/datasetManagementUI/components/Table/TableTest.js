import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { Table } from 'components/Table';
import React from 'react';
import dotProp from 'dot-prop-immutable';

const defaultProps = {
  entities: {},
  params: {
    category: 'dataset',
    name: 'dfsdfdsf',
    fourfour: 'kg5j-unyr',
    revisionSeq: '0',
    sourceId: '312',
    inputSchemaId: '1801',
    outputSchemaId: '619'
  },
  path: {
    sourceId: 312,
    inputSchemaId: 1801,
    outputSchemaId: 619
  },
  inputSchema: {
    id: 1801,
    name: null,
    total_rows: 9,
    source_id: 312
  },
  outputSchema: {
    input_schema_id: 1801,
    id: 619,
    error_count: 0,
    created_at: '2017-05-03T00:19:34.581Z',
    created_by: {
      user_id: 'tugg-ikce',
      email: 'brandon.webster@socrata.com',
      display_name: 'branweb'
    }
  },
  displayState: {
    type: 'NORMAL',
    pageNo: 1,
    outputSchemaId: 619
  },
  outputColumns: [
    {
      position: 0,
      is_primary_key: false,
      id: 9393,
      field_name: 'id',
      display_name: 'ID',
      description: '',
      transform_id: 7883,
      transform: {
        attempts: 1,
        error_indicies: [],
        transform_input_columns: [
          {
            input_column_id: 7989
          }
        ],
        transform_expr: 'to_number(`id`)',
        output_soql_type: 'number',
        id: 7883,
        completed_at: '2017-05-02T21:34:09',
        contiguous_rows_processed: 9
      }
    },
    {
      position: 1,
      is_primary_key: false,
      id: 9394,
      field_name: 'case_number',
      display_name: 'Case Number',
      description: '',
      transform_id: 7884,
      transform: {
        attempts: 1,
        error_indicies: [],
        transform_input_columns: [
          {
            input_column_id: 7990
          }
        ],
        transform_expr: '`case_number`',
        output_soql_type: 'text',
        id: 7884,
        completed_at: '2017-05-02T21:34:09',
        contiguous_rows_processed: 9
      }
    },
    {
      position: 2,
      is_primary_key: false,
      id: 9415,
      field_name: 'date_2',
      display_name: 'Date',
      description: '',
      ignored: true,
      transform_id: 7885,
      transform: {
        attempts: 1,
        error_indicies: [],
        transform_input_columns: [
          {
            input_column_id: 7991
          }
        ],
        transform_expr: 'to_floating_timestamp(`date`)',
        output_soql_type: 'calendar_date',
        id: 7885,
        completed_at: '2017-05-02T21:34:09',
        contiguous_rows_processed: 9
      }
    }
  ],
  apiCallsByColumnId: {},
  updateColumnType: () => {},
  addColumn: () => {},
  dropColumn: () => {},
  validateThenSetRowIdentifier: () => {}
};

describe('components/Table', () => {
  it('renders a column header for each output column', () => {
    const component = shallow(<Table {...defaultProps} />);
    assert.equal(
      component.find('withRouter(ColumnHeader)').length,
      defaultProps.outputColumns.length
    );
  });

  it('renders a status for each output column', () => {
    const component = shallow(<Table {...defaultProps} />);
    assert.equal(
      component.find('withRouter(TransformStatus)').length,
      defaultProps.outputColumns.length
    );
  });

  it('renders a table body component', () => {
    const component = shallow(<Table {...defaultProps} />);
    assert.isFalse(component.find('Connect(TableBody)').isEmpty());
  });

  it('renders a disabled ColumnHeader if column is ignored', () => {
    const component = shallow(<Table {...defaultProps} />);
    assert.isTrue(
      component.find('withRouter(ColumnHeader)').last().prop('outputColumn')
        .ignored
    );
  });

  it('renders a row-errors link if the input schema says there are row errors', () => {
    const propsWithRowErrors = dotProp.set(
      defaultProps,
      'inputSchema',
      existing => ({
        ...existing,
        num_row_errors: 1
      })
    );

    const component = shallow(<Table {...propsWithRowErrors} />);

    assert.equal(component.find('withRouter(RowErrorsLink)').length, 1);
  });
});
