import { socrataFetch } from '../lib/http';
import * as DisplayState from '../lib/displayState';

function whatShouldWeLoad(db, displayState) {
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS:
      console.log('load column errors', displayState);
      break;

    case DisplayState.ROW_ERRORS:
      console.log('load row errors', displayState);
      break;

    case DisplayState.NORMAL:
      // k, question is... how do we know what we've already started loading?
      // what would I use if I weren't using a table?
      // I just don't want to have to think though... I just want indexed tables.
      // it's not a lot to ask for. I should really just write a live-graphql-on-indexed-tables
      // lib in JS
      console.log('load normal', displayState);
      break;
  }
}

export function loadVisibleData(displayState) {
  return (dispatch, getState) => {
    const toLoad = whatShouldWeLoad(getState().db, displayState);
  };
}

export const UPDATE_DISPLAY_STATE = 'UPDATE_DISPLAY_STATE';
export const updateDisplayState = (displayState) => ({
  type: UPDATE_DISPLAY_STATE,
  displayState
});
