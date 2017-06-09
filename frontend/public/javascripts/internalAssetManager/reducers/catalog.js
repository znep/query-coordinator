import _ from 'lodash';

const getInitialState = () => _.get(window, 'initialState.catalog', {
  columns: [],
  fetchingResults: false,
  fetchingResultsError: false,
  filters: {},
  order: {},
  pageNumber: 1,
  results: [],
  resultSetSize: 0
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'UPDATE_CATALOG_RESULTS') {
    let sortedResults = [];

    // If the "Only recently viewed" checkbox is clicked, we want to manually re-order the results to be
    // in the order of the recently viewed, from local storage.
    if (action.onlyRecentlyViewed && window.lastAccessed && !_.isEmpty(window.lastAccessed.keys())) {
      const sortedUids = window.lastAccessed.keys();
      sortedUids.forEach((uid) => {
        sortedResults.push(
          action.response.results.find((result) => (result.resource.id === uid))
        );
      });
    } else {
      sortedResults = action.response.results;
    }

    return {
      ...state,
      results: _.compact(sortedResults),
      resultSetSize: action.response.resultSetSize
    };
  }

  if (action.type === 'FETCH_RESULTS') {
    return {
      ...state,
      fetchingResults: true,
      fetchingResultsError: false
    };
  }

  if (action.type === 'FETCH_RESULTS_SUCCESS') {
    return {
      ...state,
      fetchingResults: false,
      fetchingResultsError: false
    };
  }

  if (action.type === 'FETCH_RESULTS_ERROR') {
    return {
      ...state,
      fetchingResults: false,
      fetchingResultsError: true
    };
  }

  if (action.type === 'CHANGE_SORT_ORDER') {
    return {
      ...state,
      order: action.order
    };
  }

  if (action.type === 'CHANGE_PAGE') {
    return {
      ...state,
      pageNumber: action.pageNumber
    };
  }

  return state;
};
