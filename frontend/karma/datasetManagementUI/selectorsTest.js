import { assert } from 'chai';
import * as Selectors from 'selectors';
import dotProp from 'dot-prop-immutable';
import entities from './data/entities';

const defaultState = {
  task_sets: {
    '26': {
      updated_at: '2017-06-13T22:20:58.286690',
      status: 'successful',
      output_schema_id: 136,
      log: [
        {
          time: '2017-06-13T22:20:58',
          stage: 'dataset_tabular',
          details: null
        },
        {
          time: '2017-06-13T22:20:58',
          stage: 'dataset_public',
          details: null
        },
        {
          time: '2017-06-13T22:20:57',
          stage: 'dataset_published',
          details: null
        },
        {
          time: '2017-06-13T22:20:57',
          stage: 'upsert_complete',
          details: {
            'Rows Updated': 0,
            'Rows Deleted': 0,
            'Rows Created': 9,
            Errors: 0,
            'By SID': 0,
            'By RowIdentifier': 0
          }
        },
        {
          time: '2017-06-13T22:20:57',
          stage: 'rows_upserted',
          details: {
            count: 20
          }
        },
        {
          time: '2017-06-13T22:20:57',
          stage: 'columns_created',
          details: {
            created: -22
          }
        },
        {
          time: '2017-06-13T22:20:54',
          stage: 'started',
          details: null
        }
      ],
      job_uuid: '0d5eed70-201f-4de1-b429-59c73eb32ad8',
      id: 26,
      finished_at: new Date(1497392458000),
      created_by: {
        user_id: 'tugg-ikce',
        email: 'brandon.webster@socrata.com',
        display_name: 'branweb'
      },
      created_at: '2017-06-13T22:20:54.066648'
    }
  }
};

describe('Selectors', () => {

  describe('rowsUpserted', () => {
    it('returns the number of rows upserted for an upsert job', () => {
      assert.equal(Selectors.rowsUpserted(defaultState, '26'), 20);
    });

    it("returns 0 if we haven't created any columns yet", () => {
      const updatedState = dotProp.set(defaultState, 'task_sets.26.log', []);
      assert.equal(Selectors.rowsUpserted(updatedState, '26'), 0);
    });
  });

  describe('columnsForOutputSchema', () => {
    it('returns all columns for an output schema, including is_primary_key from join table', () => {
      const entities = {
        output_schemas: {
          1: { id: 1 },
          5: { id: 5 },
          7: { id: 7 }
        },
        output_columns: {
          51: { id: 51, schema_column_index: 7, transform_id: 1 },
          52: { id: 52, schema_column_index: 0, transform_id: 2 },
          53: { id: 53, schema_column_index: 1, transform_id: 3 },
          54: { id: 54, schema_column_index: 2, transform_id: 4 },
          55: { id: 55, schema_column_index: 5, transform_id: 5 }
        },
        transforms: {
          1: { id: 1 },
          2: { id: 2 },
          3: { id: 3 },
          4: { id: 4 },
          5: { id: 5 }
        },
        output_schema_columns: {
          '5-51': { output_schema_id: 5, output_column_id: 51 },
          '1-52': {
            output_schema_id: 1,
            output_column_id: 52,
            is_primary_key: true
          },
          '1-53': { output_schema_id: 1, output_column_id: 53 },
          '1-54': { output_schema_id: 1, output_column_id: 54 },
          '7-55': { output_schema_id: 7, output_column_id: 55 }
        }
      };

      assert.deepEqual(Selectors.columnsForOutputSchema(entities, 1), [
        {
          id: 52,
          schema_column_index: 0,
          transform_id: 2,
          transform: { id: 2 },
          is_primary_key: true
        },
        {
          id: 53,
          schema_column_index: 1,
          transform_id: 3,
          transform: { id: 3 },
          is_primary_key: false
        },
        {
          id: 54,
          schema_column_index: 2,
          transform_id: 4,
          transform: { id: 4 },
          is_primary_key: false
        }
      ]);
    });
  });

  describe('sourcesInProgress', () => {
    it('returns all sources that are updating', () => {
      const apiCalls = {
        'f992f394-4785-4337-a3f8-c912813e10d7': {
          id: 'f992f394-4785-4337-a3f8-c912813e10d7',
          status: 'STATUS_CALL_IN_PROGRESS',
          operation: 'CREATE_UPLOAD',
          params: {
            source_type: {
              type: 'upload',
              filename: 'petty_crimes.csv'
            }
          }
        },
        '0453da56-cdba-47f7-b9d8-b0852c4d4dee': {
          id: '0453da56-cdba-47f7-b9d8-b0852c4d4dee',
          status: 'STATUS_CALL_SUCCEEDED',
          operation: 'UPLOAD_FILE',
          params: {
            id: 113
          }
        }
      };

      const selection = Selectors.sourcesInProgress(apiCalls);

      assert.equal(selection.length, 1);
      assert.equal(selection[0].id, Object.keys(apiCalls)[0]);
    });
  });

  describe('latestOutputSchema', () => {
    it('returns schema with the highest id', () => {
      const entities = {
        output_schemas: {
          1: { id: 1 },
          2: { id: 2 }
        }
      };
      assert.deepEqual(Selectors.latestOutputSchema(entities), { id: 2 });
    });

    it('returns undefined if there are no output schemas', () => {
      const entities = {
        output_schemas: {}
      };
      assert.deepEqual(Selectors.latestOutputSchema(entities), undefined);
    });
  });

  describe('rowsTransformed', () => {
    it('returns the min of contiguous_rows_transformed', () => {
      const columns = [
        { transform: { contiguous_rows_processed: 20 } },
        { transform: { contiguous_rows_processed: 30 } }
      ];
      assert.equal(Selectors.rowsTransformed(columns), 20);
    });

    it('returns 0 if some transforms have no contiguous_rows_transform attribute', () => {
      const columns = [
        { transform: { contiguous_rows_processed: 20 } },
        { transform: {} }
      ];
      assert.equal(Selectors.rowsTransformed(columns), 0);
    });

    it('returns 0 if none of the transforms have a contiguous_rows_transform attribute', () => {
      const columns = [{ transform: {} }, { transform: {} }];
      assert.equal(Selectors.rowsTransformed(columns), 0);
    });
  });

  describe('currentAndIgnoredOutputColumns', () => {
    const output = Selectors.currentAndIgnoredOutputColumns(entities);

    it('puts all columns in current output schema into current array', () => {
      const outputSchemaIds = Object.keys(entities.output_schemas)
        .map(_.toNumber)
        .filter(key => !!key);

      const latestOutputSchemaId = Math.max(...outputSchemaIds);

      const currentOutputColumnIds = _.chain(entities.output_schema_columns)
        .filter(osc => osc.output_schema_id === latestOutputSchemaId)
        .reduce((innerAcc, osc) => {
          return [...innerAcc, osc.output_column_id];
        }, [])
        .value();

      const CurrentIdsFromSelector = output.current.map(oc => oc.id);

      assert.deepEqual(currentOutputColumnIds, CurrentIdsFromSelector);
    });

    it('puts ignored columns in ignored array', () => {
      assert.equal(output.ignored.length, 2);
    });

    it('omits column from ignored array if a current column exists with same transform id', () => {
      const currentTransformIds = output.current.map(oc => oc.transform_id);
      const ignoredTransformIds = output.ignored.map(oc => oc.transform_id);
      ignoredTransformIds.forEach(tid =>
        assert.notInclude(currentTransformIds, tid)
      );
    });

    it('does not have columns in ignored array that share the same transform id', () => {
      const ignoredTransformIds = output.ignored.map(oc => oc.transform_id);

      ignoredTransformIds.forEach(tid => {
        const tidIdx = _.findIndex(ignoredTransformIds, id => id === tid);
        const withoutCurrent = ignoredTransformIds.filter(
          (id, idx) => idx !== tidIdx
        );
        assert.notInclude(withoutCurrent, tid);
      });
    });

    it('crawls backwards through output schemas to figure out which ignored column to keep if there is more than one', () => {
      const ignoredColumnsWithSameTransform = [1923, 1943];
      const ignoredColumnIds = output.ignored.map(oc => oc.id);
      assert.include(ignoredColumnIds, ignoredColumnsWithSameTransform[1]);
      assert.notInclude(ignoredColumnIds, ignoredColumnsWithSameTransform[0]);
    });

    it('returns only output columns derived for the current input schema', () => {
      const outputSchemaIds = Object.keys(entities.output_schemas)
        .map(_.toNumber)
        .filter(key => !!key);

      const latestOutputSchemaId = Math.max(...outputSchemaIds);

      const currentInputSchemaId =
        entities.output_schemas[latestOutputSchemaId].input_schema_id;

      const currentInputColumns = Object.keys(entities.input_columns).filter(
        icid =>
          entities.input_columns[icid].input_schema_id === currentInputSchemaId
      );

      const returnedColumns = [...output.current, ...output.ignored];

      assert.isAtMost(returnedColumns.length, currentInputColumns.length);
    });
  });

  describe('allTransformsDone', () => {

    it('returns false when transforms not done', () => {
      const columnsWithTransforms = [
        { transform: { contiguous_rows_processed: 2500 } },
        { transform: { contiguous_rows_processed: 300 } }
      ];
      const inputSchema = {
        total_rows: 5000
      };
      const result = Selectors.allTransformsDone(columnsWithTransforms, inputSchema);
      assert.isFalse(result);
    });

    it('returns false when transform progress not defined yet', () => {
      const columnsWithTransforms = [
        { transform: {} },
        { transform: { contiguous_rows_processed: 300 } }
      ];
      const inputSchema = {
        total_rows: 5000
      };
      const result = Selectors.allTransformsDone(columnsWithTransforms, inputSchema);
      assert.isFalse(result);
    });

    it('returns true when transform progress matches input schema', () => {
      const columnsWithTransforms = [
        { transform: { contiguous_rows_processed: 5000 } },
        { transform: { contiguous_rows_processed: 5000 } }
      ];
      const inputSchema = {
        total_rows: 5000
      };
      const result = Selectors.allTransformsDone(columnsWithTransforms, inputSchema);
      assert.isTrue(result);
    });

    // EN-16784
    it('returns true when input schema has 0 rows', () => {
      const columnsWithTransforms = [
        { transform: { contiguous_rows_processed: 0 } },
        { transform: { contiguous_rows_processed: 0 } }
      ];
      const inputSchema = {
        total_rows: 0
      };
      const result = Selectors.allTransformsDone(columnsWithTransforms, inputSchema);
      assert.isTrue(result);
    });

  });

});
