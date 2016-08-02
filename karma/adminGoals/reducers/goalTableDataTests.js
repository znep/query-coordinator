import Immutable from 'immutable';
import { combineReducers } from 'redux-immutablejs';
import {
  TABLE_ROW_SELECTED,
  TABLE_ROW_DESELECTED,
  TABLE_ROW_ALL_SELECTION_TOGGLE,
  TABLE_ROW_SELECTION_START,
  TABLE_ROW_SELECTION_END,
  TABLE_ROW_SELECTION_CANCEL
} from 'actionTypes';
import goalTableData from 'reducers/goalTableData';

describe('goalTableData reducers', () => {
  const testReducer = combineReducers({ goalTableData });

  it(`should handle ${TABLE_ROW_SELECTED}`, () => {
    const defaultState = Immutable.Map({
      goalTableData: {
        selectedRows: []
      }
    });

    const reducerReturn = testReducer(defaultState, {
      type: TABLE_ROW_SELECTED,
      goalId: 'xxxx-xxxx'
    });

    const expectedReturn = {
      goalTableData: {
        selectedRows: ['xxxx-xxxx']
      }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });

  it(`should handle ${TABLE_ROW_DESELECTED}`, () => {
    const defaultState = Immutable.Map({
      goalTableData: {
        selectedRows: ['xxxx-xxxx']
      }
    });

    const reducerReturn = testReducer(defaultState, {
      type: TABLE_ROW_DESELECTED,
      goalId: 'xxxx-xxxx'
    });

    const expectedReturn = {
      goalTableData: {
        selectedRows: []
      }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });

  it(`should handle ${TABLE_ROW_ALL_SELECTION_TOGGLE} checked`, () => {
    const defaultState = Immutable.Map({
      goalTableData: {
        goals: [
          { id: 'xxxx-xxxx' },
          { id: 'yyyy-yyyy' }
        ],
        selectedRows: []
      }
    });

    const reducerReturn = testReducer(defaultState, {
      type: TABLE_ROW_ALL_SELECTION_TOGGLE,
      checked: true
    });

    const expectedReturn = {
      goalTableData: {
        goals: [
          { id: 'xxxx-xxxx' },
          { id: 'yyyy-yyyy' }
        ],
        selectedRows: ['xxxx-xxxx', 'yyyy-yyyy']
      }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });

  it(`should handle ${TABLE_ROW_ALL_SELECTION_TOGGLE} unchecked`, () => {
    const defaultState = Immutable.Map({
      goalTableData: {
        goals: [
          { id: 'xxxx-xxxx' },
          { id: 'yyyy-yyyy' }
        ],
        selectedRows: ['xxxx-xxxx', 'yyyy-yyyy']
      }
    });

    const reducerReturn = testReducer(defaultState, {
      type: TABLE_ROW_ALL_SELECTION_TOGGLE,
      checked: false
    });

    const expectedReturn = {
      goalTableData: {
        goals: [
          { id: 'xxxx-xxxx' },
          { id: 'yyyy-yyyy' }
        ],
        selectedRows: []
      }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });

  it(`should handle ${TABLE_ROW_SELECTION_START}`, () => {
    const defaultState = Immutable.Map({
      goalTableData: {}
    });

    const reducerReturn = testReducer(defaultState, {
      type: TABLE_ROW_SELECTION_START,
      goalId: 'xxxx-xxxx'
    });

    const expectedReturn = {
      goalTableData: {
        multipleRowSelection: 'xxxx-xxxx'
      }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });

  it(`should handle ${TABLE_ROW_SELECTION_END}`, () => {
    const goals = [
      { id: 'aaaa-aaaa' },
      { id: 'bbbb-bbbb' },
      { id: 'cccc-cccc' },
      { id: 'dddd-dddd' },
      { id: 'ffff-ffff' },
      { id: 'eeee-eeee' }
    ];

    const cachedGoals = {
      'aaaa-aaaa': { id: 'aaaa-aaaa' },
      'bbbb-bbbb': { id: 'bbbb-bbbb' },
      'cccc-cccc': { id: 'cccc-cccc' },
      'dddd-dddd': { id: 'dddd-dddd' },
      'ffff-ffff': { id: 'ffff-ffff' },
      'eeee-eeee': { id: 'eeee-eeee' }
    };

    const defaultState = Immutable.Map({
      goalTableData: {
        multipleRowSelection: 'bbbb-bbbb',
        selectedRows: [],
        goals,
        cachedGoals
      }
    });

    const reducerReturn = testReducer(defaultState, {
      type: TABLE_ROW_SELECTION_END,
      goalId: 'ffff-ffff'
    });

    const expectedReturn = {
      goalTableData: {
        multipleRowSelection: false,
        goals,
        cachedGoals,
        selectedRows: ['bbbb-bbbb', 'cccc-cccc', 'dddd-dddd', 'ffff-ffff']
      }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });

  it(`should handle ${TABLE_ROW_SELECTION_CANCEL}`, () => {
    const defaultState = Immutable.Map({
      goalTableData: {}
    });

    const reducerReturn = testReducer(defaultState, {
      type: TABLE_ROW_SELECTION_CANCEL
    });

    const expectedReturn = {
      goalTableData: {
        multipleRowSelection: false
      }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });

});
