import { socrataFetch } from '../lib/http';
import * as DisplayState from '../lib/displayState';

function getLoadPlan(db, outputSchemaId, displayState) {
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS:
      console.log('load column errors', outputSchemaId, displayState);
      break;

    case DisplayState.ROW_ERRORS:
      console.log('load row errors', outputSchemaId, displayState);
      break;

    case DisplayState.NORMAL:
      // k, question is... how do we know what we've already started loading?
      // what would I use if I weren't using a table?
      // I just don't want to have to think though... I just want indexed tables.
      // it's not a lot to ask for. I should really just write a live-graphql-on-indexed-tables
      // lib in JS
      console.log('load normal', outputSchemaId, displayState);
      return {
        type: 'NORMAL',
        pageNo: displayState.pageNo
      };
  }
}

export function loadVisibleData(outputSchemaId, displayState) {
  return (dispatch, getState) => {
    const loadPlan = getLoadPlan(getState().db, outputSchemaId, displayState);
    dispatch(doLoadPlan(loadPlan));
  };
}

function doLoadPlan(loadPlan) {
  return (dispatch) => {
    console.log('loadPlan', loadPlan);
  };
}

export const UPDATE_DISPLAY_STATE = 'UPDATE_DISPLAY_STATE';
export const updateDisplayState = (displayState) => ({
  type: UPDATE_DISPLAY_STATE,
  displayState
});
