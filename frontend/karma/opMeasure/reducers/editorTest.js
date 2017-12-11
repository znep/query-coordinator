import { assert } from 'chai';
import _ from 'lodash';

import { CalculationTypeNames, PeriodTypes, PeriodSizes } from 'lib/constants';
import reducer from 'reducers/editor';
import actions from 'actions';

const { INITIAL_STATE } = reducer;

describe('Edit modal reducer', () => {
  let state;

  beforeEach(() => {
    state = reducer();
  });

  afterEach(() => {
    state = undefined;
  });

  describe('SET_AGGREGATION_TYPE', () => {
    it('throws if measure type is not "rate"', () => {
      state = reducer(state, actions.editor.setCalculationType('count'));
      assert.throws(() => {
        reducer(state, actions.editor.setAggregationType('sum'))
      });
    });

    it('removes columns from arguments if they are incompatible with the new aggregation type', () => {
      state.dataSourceViewMetadata = {
        columns: [
          { fieldName: 'date', renderTypeName: 'calendar_date' },
          { fieldName: 'text', renderTypeName: 'text' },
          { fieldName: 'number', renderTypeName: 'number' },
          { fieldName: 'money', renderTypeName: 'money' }
        ]
      };

      // Full tests for isColumnUsableWithMeasureArgument exist in the measureCalculator tests.
      state = reducer(state, actions.editor.setCalculationType('rate'));
      state = reducer(state, actions.editor.setNumeratorColumn('date'));
      state = reducer(state, actions.editor.setDenominatorColumn('text'));
      assert.nestedPropertyVal(state, 'measure.metric.arguments.numeratorColumn', 'date');
      assert.nestedPropertyVal(state, 'measure.metric.arguments.denominatorColumn', 'text');

      // Check count calculations. They are OK with any column types.
      state = reducer(state, actions.editor.setAggregationType('count'));
      assert.nestedPropertyVal(state, 'measure.metric.arguments.numeratorColumn', 'date'); // Same as before
      assert.nestedPropertyVal(state, 'measure.metric.arguments.denominatorColumn', 'text'); // Same as before

      // Now check going from count to sum. Sum calculations require a numerical type.
      // Our current columns are date and text, so both should be removed once we select sum.
      state = reducer(state, actions.editor.setAggregationType('sum'));
      assert.notNestedProperty(state, 'measure.metric.arguments.numeratorColumn'); // Gone (was date).
      assert.notNestedProperty(state, 'measure.metric.arguments.denominatorColumn'); // Gone (was text).

      // Now, verify that sum accepts both Money and Number (those being numerical types).
      state = reducer(state, actions.editor.setAggregationType('count'));
      state = reducer(state, actions.editor.setNumeratorColumn('number'));
      state = reducer(state, actions.editor.setDenominatorColumn('money'));
      assert.nestedPropertyVal(state, 'measure.metric.arguments.numeratorColumn', 'number'); // Test sanity.
      assert.nestedPropertyVal(state, 'measure.metric.arguments.denominatorColumn', 'money'); // Test sanity.
      state = reducer(state, actions.editor.setAggregationType('sum'));
      assert.nestedPropertyVal(state, 'measure.metric.arguments.numeratorColumn', 'number'); // Numeric type, so should still be set.
      assert.nestedPropertyVal(state, 'measure.metric.arguments.denominatorColumn', 'money'); // Numeric type, so should still be set.

      // Finally, ensure selecting count does not inadvertently clear out numeric types.
      state = reducer(state, actions.editor.setAggregationType('count'));
      assert.nestedPropertyVal(state, 'measure.metric.arguments.numeratorColumn', 'number');
      assert.nestedPropertyVal(state, 'measure.metric.arguments.denominatorColumn', 'money');
    });
  });

  describe('SET_DATA_SOURCE_UID', () => {
    it('updates the data source uid in the measure metric', () => {
      const dataSource = {
        uid: 'test-test'
      };

      assert.notNestedProperty(state.measure, 'metric.dataSource');

      state = reducer(state, actions.editor.setDataSourceUid('test-test'));

      assert.deepEqual(state.measure.metric.dataSource, dataSource);
    });
  });

  describe('RECEIVE_DATA_SOURCE_METADATA', () => {
    it('updates cachedRowCount in the editor state', () => {
      _.set(state, 'measure.metric.dataSource', {
        uid: 'test-test'
      });

      assert.notNestedProperty(state, 'cachedRowCount');

      state = reducer(state, actions.editor.receiveDataSourceMetadata(100, {}));

      assert.equal(state.cachedRowCount, 100);
    });

    it('updates the dataSourceViewMetadata in editor state', () => {
      const viewMetadata = {
        id: 'xxxx-xxxx',
        columns: []
      };

      _.set(state, 'measure.metric.dataSource', {
        uid: 'test-test'
      });

      assert.notNestedProperty(state, 'dataSourceViewMetadata');

      state = reducer(state, actions.editor.receiveDataSourceMetadata(100, viewMetadata));

      assert.deepEqual(state.dataSourceViewMetadata, viewMetadata);
    });

    it('resets metric config to default', () => {
      const viewMetadata = {
        id: 'xxxx-xxxx',
        columns: []
      };

      _.set(state, 'measure.metric.dataSource', {
        uid: 'test-test'
      });

      _.set(state, 'measure.metric.type', CalculationTypeNames.SUM);
      _.set(state, 'measure.metric.arguments.foo', 'hello');

      state = reducer(state, actions.editor.receiveDataSourceMetadata(100, viewMetadata));
      assert.equal(state.measure.metric.type, CalculationTypeNames.COUNT);
      assert.notNestedProperty(state, 'measure.metric.arguments.foo');
    });

    it('throws if not given a number for the rowCount', () => {
      _.set(state, 'measure.metric.dataSource', {
        uid: 'test-test'
      });

      assert.throws(() => reducer(state, actions.editor.receiveDataSourceMetadata('100', {})));
    });

    it('throws if not given an object for the dataSourceViewMetadata', () => {
      _.set(state, 'measure.metric.dataSource', {
        uid: 'test-test'
      });

      assert.throws(() => reducer(state, actions.editor.receiveDataSourceMetadata(100, 'im not really an object')));
    });
  });

  describe('SET_NUMERATOR_COLUMN_CONDITION', () => {
    it('throws if the calculation type is not rate', () => {
      assert.throws(() => {
        state = reducer(state, actions.editor.setCalculationType('count'));
        reducer(state, actions.editor.setNumeratorColumnCondition({}))
      });
    });

    it('replaces the appropriate argument', () => {
      state = reducer(state, actions.editor.setCalculationType('rate'));

      const newCondition1 = { type: 'mock1', foo: 'bar' };
      state = reducer(state, actions.editor.setNumeratorColumnCondition(newCondition1));

      const newCondition2 = { type: 'mock2' };
      state = reducer(state, actions.editor.setNumeratorColumnCondition(_.cloneDeep(newCondition2)));
      assert.deepEqual(state.measure.metric.arguments.numeratorColumnCondition, newCondition2);
    });
  });

  describe('SET_COLUMN', () => {
    it('updates the column in metric arguments with the column field name', () => {
      const columnFieldName = 'yay im a column';

      assert.notNestedProperty(state, 'measure.metric.arguments.column');

      state = reducer(state, actions.editor.setColumn(columnFieldName));
      assert.equal(state.measure.metric.arguments.column, columnFieldName);
    });

    it('throws if not given a string for fieldName', () => {
      const notAString = 42;

      assert.notNestedProperty(state, 'measure.metric.arguments.column');

      assert.throws(() => reducer(state, actions.editor.setColumn(notAString)));
    });
  });

  describe('SET_VALUE_COLUMN', () => {
    it('updates the valueColumn in metric arguments with the column field name', () => {
      const columnFieldName = 'some value column';

      assert.notNestedProperty(state, 'measure.metric.arguments.valueColumn');

      state = reducer(state, actions.editor.setValueColumn(columnFieldName));
      assert.equal(state.measure.metric.arguments.valueColumn, columnFieldName);
    });

    it('throws if not given a string for fieldName', () => {
      const notAString = 42;

      assert.notNestedProperty(state, 'measure.metric.arguments.valueColumn');

      assert.throws(() => reducer(state, actions.editor.setValueColumn(notAString)));
    });
  });

  describe('SET_DATE_COLUMN', () => {
    it('updates the dateColumn in metric arguments with the column field name', () => {
      const columnFieldName = 'some date column';

      assert.notNestedProperty(state, 'measure.metric.arguments.dateColumn');

      state = reducer(state, actions.editor.setDateColumn(columnFieldName));
      assert.equal(state.measure.metric.arguments.dateColumn, columnFieldName);
    });

    it('throws if not given a string for fieldName', () => {
      const notAString = 42;

      assert.notNestedProperty(state, 'measure.metric.arguments.dateColumn');

      assert.throws(() => reducer(state, actions.editor.setDateColumn(notAString)));
    });
  });

  describe('SET_ANALYSIS', () => {
    it('updates the analysis description in the measure metadata', () => {
      assert.notNestedProperty(state.measure, 'metadata.analysis');

      state = reducer(state, actions.editor.setAnalysis('Some analysis text'));

      assert.equal(state.measure.metadata.analysis, 'Some analysis text');
    });
  });

  describe('SET_CALCULATION_TYPE', () => {
    it('updates the calculation type in the measure metric', () => {
      assert.notNestedProperty(state, 'measure.metric.type');

      state = reducer(state, actions.editor.setCalculationType('count'));

      assert.nestedPropertyVal(state, 'measure.metric.type', 'count' );
    });

    it('sets default arguments', () => {
      state = reducer(state, actions.editor.setCalculationType('count'));
      assert.nestedPropertyVal(state, 'measure.metric.arguments.includeNullValues', true);

      state = reducer(state, actions.editor.setCalculationType('rate'));
      assert.nestedPropertyVal(state, 'measure.metric.arguments.denominatorIncludeNullValues', true);
    });

    it('removes all values in "measure.metric" except for argument defaults and dataSource uid', () => {
      state = reducer(state, actions.editor.setCalculationType('sum'));
      _.set(state, 'measure.metric.arguments.column', 'some column');
      _.set(state, 'measure.metric.arguments.something', 'what');
      _.set(state, 'measure.metric.dataSource.uid', 'test-test');

      state = reducer(state, actions.editor.setCalculationType('count'));
      assert.notNestedProperty(state, 'measure.metric.arguments.column');
      assert.notNestedProperty(state, 'measure.metric.arguments.something');
      assert.equal(state.measure.metric.dataSource.uid, 'test-test');
    });
  });

  describe('SET_UNIT_LABEL', () => {
    it('updates the label in the measure metric', () => {
      assert.notNestedProperty(state, 'measure.metric.display.label');

      state = reducer(state, actions.editor.setUnitLabel('cold hard cash'));

      assert.nestedPropertyVal(state, 'measure.metric.display.label', 'cold hard cash' );
    });
  });

  describe('SET_START_DATE', () => {
    it('updates the start date in the metric', () => {
      assert.notNestedProperty(state, 'measure.metric.reportingPeriod.startDate');
      const testDate = '2017-11-29';
      state = reducer(state, actions.editor.setStartDate(testDate));
      assert.equal(state.measure.metric.reportingPeriod.startDate, testDate);
    });

    // TODO: Test for bogus date values?
  });

  describe('SET_PERIOD_TYPE', () => {
    it('updates the period type in the metric', () => {
      const { OPEN, CLOSED } = PeriodTypes;
      state = reducer(state, actions.editor.setPeriodType(OPEN));

      assert.equal(state.measure.metric.reportingPeriod.type, OPEN);
    });

    // TODO: Test for invalid period types?
  });

  describe('SET_PERIOD_SIZE', () => {
    it('updates the period size in the metric', () => {
      assert.notNestedProperty(state, 'measure.metric.reportingPeriod.size');
      state = reducer(state, actions.editor.setPeriodSize(PeriodSizes[0]));
      assert.equal(state.measure.metric.reportingPeriod.size, PeriodSizes[0]);
    });

    // TODO: Should we test for bogus size values?
  });

  describe('TOGGLE_DISPLAY_AS_PERCENT', () => {
    it('toggles display.asPercent in the measure metric', () => {
      assert.notNestedProperty(state, 'measure.metric.display.asPercent');

      state = reducer(state, actions.editor.toggleDisplayAsPercent());
      assert.nestedPropertyVal(state, 'measure.metric.display.asPercent', true);

      state = reducer(state, actions.editor.toggleDisplayAsPercent());
      assert.nestedPropertyVal(state, 'measure.metric.display.asPercent', false);
    });
  });

  describe('TOGGLE_INCLUDE_NULL_VALUES', () => {
    it('toggles arguments.includeNullValues in the measure metric, with a default implied value of true', () => {
      assert.notNestedProperty(state, 'measure.metric.arguments.includeNullValues');

      state = reducer(state, actions.editor.toggleIncludeNullValues());
      assert.nestedPropertyVal(state, 'measure.metric.arguments.includeNullValues', false);

      state = reducer(state, actions.editor.toggleIncludeNullValues());
      assert.nestedPropertyVal(state, 'measure.metric.arguments.includeNullValues', true);
    });
  });

  describe('SET_METHODS', () => {
    it('updates the methods description in the measure metadata', () => {
      assert.notNestedProperty(state.measure, 'metadata.methods');

      state = reducer(state, actions.editor.setMethods('Some methods text'));

      assert.equal(state.measure.metadata.methods, 'Some methods text');
    });
  });

  describe('SET_DESCRIPTION', () => {
    it('updates the description of the measure', () => {
      assert.notNestedProperty(state.measure, 'description');

      state = reducer(state, actions.editor.setDescription('Some description'));

      assert.equal(state.measure.description, 'Some description');
    });
  });

  describe('SET_FULL_TITLE', () => {
    it('sets the full title of the measure', () => {
      assert.notNestedProperty(state.measure, 'name');

      state = reducer(state, actions.editor.setName('Full name'));

      assert.equal(state.measure.name, 'Full name');
    });
  });

  describe('SET_SHORT_TITLE', () => {
    it('sets the short title of the measure', () => {
      assert.notNestedProperty(state.measure, 'shortName');

      state = reducer(state, actions.editor.setShortName('Short name'));

      assert.equal(state.measure.shortName, 'Short name');
    });
  });

  // Note: This is a thunk action - we test the non-thunk parts here.
  // The thunk is tested in actionsTest.js.
  describe('OPEN_EDIT_MODAL', () => {
    // NOTE: Our reducer should reject any fields not in our schema.
    //       Thus, the expected result of these tests should not
    //       include the "fake" field.
    const fakeMeasure = {
      fake: 'measure',
      metric: {
        type: 'sum'
      }
    };

    it('sets the editing state to true', () => {
      assert.isFalse(state.isEditing);

      state = reducer(state, {
        type: actions.editor.OPEN_EDIT_MODAL,
        measure: fakeMeasure
      });

      assert.isTrue(state.isEditing);
    });

    describe('when metric type is set', () => {
      it('preserves existing metric type', () => {
        state = reducer(state, {
          type: actions.editor.OPEN_EDIT_MODAL,
          measure: fakeMeasure
        });

        assert.equal(state.measure.metric.sum, fakeMeasure.metric.sum);
        // NOTE: pristineMeasure should also have filtered out fields that are not in our schema.
        // TODO: Create a schema file for our state.
        assert.deepPropertyVal(state, 'pristineMeasure', fakeMeasure);
      });
    });

    it('when metric type is not set', () => {
      it('defaults metric type to "count"', () => {
        const stateWithoutType = _.omit(state, 'measure.metric.type');

        state = reducer(stateWithoutType, {
          type: actions.editor.OPEN_EDIT_MODAL,
          measure: stateWithoutType.measure
        });

        assert.deepPropertyVal(state, 'measure.metric.type', 'count');
      });
    });
  });

  describe('CANCEL_EDIT_MODAL', () => {
    it('sets the editing state to false', () => {
      state = reducer(_.defaults({ isEditing: true }, INITIAL_STATE));

      assert.isTrue(state.isEditing);

      state = reducer(state, actions.editor.cancelEditModal());

      assert.isFalse(state.isEditing);
    });
  });

  // Note: This is a thunk action - we test the non-thunk parts here.
  // The thunk is tested in actionsTest.js.
  describe('ACCEPT_EDIT_MODAL_CHANGES', () => {
    it('sets the editing state to false', () => {
      state = reducer(_.defaults({ isEditing: true }, INITIAL_STATE));

      assert.isTrue(state.isEditing);

      state = reducer(state, {
        type: actions.editor.ACCEPT_EDIT_MODAL_CHANGES,
        measure: 'a different measure object'
      });

      assert.isFalse(state.isEditing);
    });
  });
});
