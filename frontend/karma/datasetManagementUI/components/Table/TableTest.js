import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { Table } from 'components/Table';

const defaultProps = {
  "db": {},
  "path": {
    "uploadId": 312,
    "inputSchemaId": 1801,
    "outputSchemaId": 619
  },
  "inputSchema": {
    "id": 1801,
    "name": null,
    "total_rows": 9,
    "upload_id": 312,
    "__status__": {
      "type": "SAVED",
      "savedAt": "ON_SERVER"
    }
  },
  "outputSchema": {
    "input_schema_id": 1801,
    "id": 619,
    "__status__": {
      "type": "SAVED",
      "savedAt": "ON_SERVER"
    },
    "error_count": 0,
    "inserted_at": "2017-05-03T00:19:34.581Z",
    "created_by": {
      "user_id": "tugg-ikce",
      "email": "brandon.webster@socrata.com",
      "display_name": "branweb"
    }
  },
  "displayState": {
    "type": "NORMAL",
    "pageNo": 1,
    "outputSchemaId": 619
  },
  "outputColumns": [
    {
      "position": 0,
      "is_primary_key": false,
      "id": 9393,
      "field_name": "id",
      "display_name": "ID",
      "description": "",
      "transform_id": 7883,
      "__status__": {
        "type": "SAVED",
        "savedAt": "ON_SERVER"
      },
      "transform": {
        "transform_input_columns": [
          {
            "input_column_id": 7989
          }
        ],
        "transform_expr": "to_number(`id`)",
        "output_soql_type": "SoQLNumber",
        "id": 7883,
        "completed_at": "2017-05-02T21:34:09",
        "__status__": {
          "type": "SAVED",
          "savedAt": "ON_SERVER"
        },
        "contiguous_rows_processed": 9
      }
    },
    {
      "position": 1,
      "is_primary_key": false,
      "id": 9394,
      "field_name": "case_number",
      "display_name": "Case Number",
      "description": "",
      "transform_id": 7884,
      "__status__": {
        "type": "SAVED",
        "savedAt": "ON_SERVER"
      },
      "transform": {
        "transform_input_columns": [
          {
            "input_column_id": 7990
          }
        ],
        "transform_expr": "`case_number`",
        "output_soql_type": "SoQLText",
        "id": 7884,
        "completed_at": "2017-05-02T21:34:09",
        "__status__": {
          "type": "SAVED",
          "savedAt": "ON_SERVER"
        },
        "contiguous_rows_processed": 9
      }
    },
    {
      "position": 2,
      "is_primary_key": false,
      "id": 9415,
      "field_name": "date_2",
      "display_name": "Date",
      "description": "",
      "ignored": true,
      "transform_id": 7885,
      "__status__": {
        "type": "SAVED",
        "savedAt": "ON_SERVER"
      },
      "transform": {
        "transform_input_columns": [
          {
            "input_column_id": 7991
          }
        ],
        "transform_expr": "to_floating_timestamp(`date`)",
        "output_soql_type": "SoQLFloatingTimestamp",
        "id": 7885,
        "completed_at": "2017-05-02T21:34:09",
        "__status__": {
          "type": "SAVED",
          "savedAt": "ON_SERVER"
        },
        "contiguous_rows_processed": 9
      }
    }
  ],
  updateColumnType: () => {},
  addColumn: () => {},
  dropColumn: () => {}
};

describe('components/Table', () => {
  it('renders a column header for each output column', () => {
    const component = shallow(<Table {...defaultProps}/>);
    assert.equal(component.find('ColumnHeader').length, defaultProps.outputColumns.length);
  });

  it('renders a status for each output column', () => {
    const component = shallow(<Table {...defaultProps}/>);
    assert.equal(component.find('TransformStatus').length, defaultProps.outputColumns.length);
  });

  it('renders a table body component', () => {
    const component = shallow(<Table {...defaultProps}/>);
    assert.isFalse(component.find('TableBody').isEmpty());
  });

  it('renders a disabled ColumnHeader if column is ignored', () => {
    const component = shallow(<Table {...defaultProps}/>);
    assert.isTrue(component.find('ColumnHeader').last().prop('isDisabled'));
  });
});
