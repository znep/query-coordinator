import sinon from 'sinon';
import { assert } from 'chai';
import TransformColumn from 'datasetManagementUI/components/TransformColumn/TransformColumn';
import { normal } from 'datasetManagementUI/lib/displayState';
import { shallow } from 'enzyme';
import React from 'react';

describe('components/TransformStatus', () => {
  const defaultProps = () => ({
    "params": {
      "category": "dataset",
      "name": "wat",
      "fourfour": "6yij-neub",
      "revisionSeq": "0",
      "sourceId": "292",
      "inputSchemaId": "333",
      "outputSchemaId": "304",
      "outputColumnId": "10424",
      "pageNo": "3",
      "transformEditor": true
    },
    "location": {
      "pathname": "/dataset/wat/6yij-neub/revisions/0/sources/292/schemas/333/output/304/editor/10424/page/3",
      "search": "",
      "hash": "",
      "action": "POP",
      "key": "06goeu",
      "query": {}
    },
    "inputSchema": {
      "id": 333,
      "name": null,
      "total_rows": 441,
      "source_id": 292,
      "num_row_errors": 0
    },
    "inputColumns": [
      {
        field_name: "the_geom",
        id: 10512,
        input_schema_id: 333,
        position: 1,
        semantic_type: null,
        soql_type: "multipolygon"
      }
    ],
    "outputSchema": {
      "total_rows": 441,
      "input_schema_id": 333,
      "id": 304,
      "finished_at": {},
      "error_count": 441,
      "created_by": {},
      "created_at": {},
      "completed_at": "2017-12-11T19:18:44"
    },
    "transform": {
      "transform_input_columns": [{
        "input_column_id": 10512
      }],
      "transform_expr": "reproject_to_wgs84(`the_geom`)",
      "parsed_expr": {
        "type": "funcall",
        "function_name": "reproject_to_wgs84",
        "args": [{
          "value": "the_geom",
          "type": "column_ref"
        }]
      },
      "output_soql_type": "multipolygon",
      "id": 10393,
      "finished_at": "2017-12-11T17:56:41",
      "failed_at": null,
      "error_count": 0,
      "completed_at": "2017-12-11T17:56:41",
      "attempts": 0,
      "error_indices": [],
      "contiguous_rows_processed": 441
    },
    "outputColumn": {
      "position": 1,
      "is_primary_key": false,
      "id": 10424,
      "format": {},
      "field_name": "the_geom",
      "display_name": "the_geom",
      "description": "",
      "transform_id": 10393,
      "transform": {
        "transform_input_columns": [{
          "input_column_id": 10512
        }],
        "transform_expr": "reproject_to_wgs84(`the_geom`)",
        "parsed_expr": {
          "type": "funcall",
          "function_name": "reproject_to_wgs84",
          "args": [{
            "value": "the_geom",
            "type": "column_ref"
          }]
        },
        "output_soql_type": "multipolygon",
        "id": 10393,
        "finished_at": "2017-12-11T17:56:41",
        "failed_at": null,
        "error_count": 0,
        "completed_at": "2017-12-11T17:56:41",
        "attempts": 0,
        "error_indices": [],
        "contiguous_rows_processed": 441
      }
    },
    "outputColumns": [{
      "position": 1,
      "is_primary_key": false,
      "id": 10424,
      "format": {},
      "field_name": "the_geom",
      "display_name": "the_geom",
      "description": "",
      "transform_id": 10393,
      "transform": {
        "transform_input_columns": [{
          "input_column_id": 10512
        }],
        "transform_expr": "reproject_to_wgs84(`the_geom`)",
        "parsed_expr": {
          "type": "funcall",
          "function_name": "reproject_to_wgs84",
          "args": [{
            "value": "the_geom",
            "type": "column_ref"
          }]
        },
        "output_soql_type": "multipolygon",
        "id": 10393,
        "finished_at": "2017-12-11T17:56:41",
        "failed_at": null,
        "error_count": 0,
        "completed_at": "2017-12-11T17:56:41",
        "attempts": 0,
        "error_indices": [],
        "contiguous_rows_processed": 441
      }
    }],
    "compiler": {
      "inputSchema": {},
      "channel": {},
      "result": {
        type: 'COMPILATION_SUCCESS'
      },
      "expression": 'foo(test)'
    },
    "scope": [
      { name: 'a_function' },
      { name: 'the_function' }
    ],
    "addCompiler": sinon.spy(),
    "compileExpression": sinon.spy(),
    "newOutputSchema": sinon.spy()
  });

  describe('TransformColumn', () => {
    it('renders', () => {
      const component = shallow(<TransformColumn {...defaultProps()} />);

      assert.isAtLeast(component.find('SoQLEditor').length, 1);
      assert.isAtLeast(component.find('Connect(SoQLResults)').length, 1);
    });

    it('will generate the correct output schema when the user hits run', () => {
      const props = defaultProps();
      const component = shallow(<TransformColumn {...props} />);

      const runButton = component.find('button');
      runButton.simulate('click');

      assert.isTrue(props.newOutputSchema.called);

      const [_inputSchema, expr, desiredColumns] = props.newOutputSchema.getCall(0).args;
      assert.equal(expr, 'foo(test)');
      assert.include(desiredColumns.map(oc => oc.transform.transform_expr), 'foo(test)');
    });

    it('will not allow you to hit run when compilation failed', () => {
      const props = {
        ...defaultProps(),
        compiler: {
          ...defaultProps().compiler,
          result: {
            type: 'COMPILATION_FAILED'
          }
        }
      };

      const component = shallow(<TransformColumn {...props} />);

      const runButton = component.find('button');
      runButton.simulate('click');

      assert.isFalse(props.newOutputSchema.called);
    });

    it('can generate an expression completer', () => {
      const component = shallow(<TransformColumn {...defaultProps()} />);

      const completer = component.instance().genExpressionCompleter();

      const results = completer('the').map(({ name }) => name);
      assert.include(results, 'the_function');
      assert.include(results, 'the_geom');
    })
  });
});
