import _ from 'lodash';
import * as actions from '../actions';

function queryChanged(state, action) {
  const { query } = action;
  const searchResults = _.isEmpty(query) ? [] : state.searchResults;

  return { ...state, query, searchResults };
}

function resultsChanged(state, action) {
  // keep results empty if the query is empty
  const searchResults = _.isEmpty(state.query) ? [] : action.results;

  return { ...state, searchResults };
}

function resultVisibilityChanged(state, action) {
  const { visible } = action;

  // make sure we aren't focused on anything if we're hiding
  const focusedResult = visible ? state.focusedResult : undefined;

  // also, re-collapse when hiding
  const collapsed = visible ? state.collapsed : true;

  return { ...state, resultsVisible: visible, focusedResult, collapsed };
}

function focusedResultChanged(state, action) {
  const { focus } = action;
  const { searchResults } = state;
  const resultsEmpty = _.isEmpty(searchResults) || _.isEmpty(searchResults.results);

  let focusedResult;
  if (resultsEmpty || focus < 0) {
    // went above results or have no results; blank out focus
    focusedResult = undefined;
  } else if (focus >= searchResults.results.length - 1) {
    // past result set, go to end of results
    focusedResult = searchResults.results.length - 1;
  } else {
    focusedResult = focus;
  }

  return { ...state, focusedResult };
}

function collapseChanged(state, action) {
  return { ...state, collapsed: action.collapsed, focusedResult: undefined };
}

function searchCleared(state, action) {
  return { ...state, query: null };
}

export default function autocompleteReducer(state, action) {
  switch (action.type) {
    case actions.QUERY_CHANGED:
      return queryChanged(state, action);
    case actions.RESULTS_CHANGED:
      return resultsChanged(state, action);
    case actions.RESULT_VISIBILITY_CHANGED:
      return resultVisibilityChanged(state, action);
    case actions.RESULT_FOCUS_CHANGED:
      return focusedResultChanged(state, action);
    case actions.COLLAPSE_CHANGED:
      return collapseChanged(state, action);
    case action.SEARCH_CLEARED:
      return searchCleared(state, action);
    default:
      return state;
  }
}
