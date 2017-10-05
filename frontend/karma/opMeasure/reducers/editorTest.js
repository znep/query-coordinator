import { assert } from 'chai';
import _ from 'lodash';

import reducer from 'reducers/editor';
import actions from 'actions';

const INITIAL_STATE = Object.freeze({
  isEditing: false,
  measure: {},
  pristineMeasure: {}
});

describe('Edit modal reducer', () => {
  let state;

  beforeEach(() => {
    state = reducer(_.cloneDeep(INITIAL_STATE));
  });

  afterEach(() => {
    state = undefined;
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
  });

  describe('SET_UNIT_LABEL', () => {
    it('updates the label in the measure metric', () => {
      assert.notNestedProperty(state, 'measure.metric.display.label');

      state = reducer(state, actions.editor.setUnitLabel('cold hard cash'));

      assert.nestedPropertyVal(state, 'measure.metric.display.label', 'cold hard cash' );
    });
  });

  describe('TOGGLE_EXCLUDE_NULL_VALUES', () => {
    it('toggles arguments.excludeNullValues in the measure metric', () => {
      assert.notNestedProperty(state, 'measure.metric.arguments.excludeNullValues');

      state = reducer(state, actions.editor.toggleExcludeNullValues());
      assert.nestedPropertyVal(state, 'measure.metric.arguments.excludeNullValues', true);

      state = reducer(state, actions.editor.toggleExcludeNullValues());
      assert.nestedPropertyVal(state, 'measure.metric.arguments.excludeNullValues', false);
    });
  });

  describe('SET_METHODS', () => {
    it('updates the methods description in the measure metadata', () => {
      assert.notNestedProperty(state.measure, 'metadata.methods');

      state = reducer(state, actions.editor.setMethods('Some methods text'));

      assert.equal(state.measure.metadata.methods, 'Some methods text');
    });
  });

  // Note: This is a thunk action - we test the non-thunk parts here.
  // The thunk is tested in actionsTest.js.
  describe('OPEN_EDIT_MODAL', () => {
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

        assert.deepPropertyVal(state, 'measure', fakeMeasure);
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
