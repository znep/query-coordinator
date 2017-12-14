import _ from 'lodash';

import { getQueryParameter } from 'common/components/AssetBrowser/lib/query_string';
import * as ceteraActions from 'common/components/AssetBrowser/actions/cetera';
import * as sortActions from 'common/components/AssetBrowser/actions/sort_order';
import * as pagerActions from 'common/components/AssetBrowser/actions/pager';
import * as ceteraHelperActions from 'common/components/AssetBrowser/lib/helpers/cetera';
import * as pageSizeActions from 'common/components/AssetBrowser/actions/page_size';

const defaultOrder = {
  ascending: false,
  value: 'lastUpdatedDate'
};

const order = _.isEmpty(getQueryParameter('orderColumn')) ? defaultOrder : {
  ascending: getQueryParameter('orderDirection') === 'asc',
  value: getQueryParameter('orderColumn')
};

const getInitialState = () => _.merge({
  columns: [],
  fetchingResults: false,
  fetchingResultsError: false,
  initialResultsFetched: false,
  order,
  pageNumber: parseInt(getQueryParameter('page', 1)),
  results: [],
  resultSetSize: 0
}, window.socrata.initialState.catalog);

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'UPDATE_CATALOG_RESULTS') {
    let sortedResults = [];

    /* If the "Only recently viewed" checkbox is clicked, any sort is removed. We manually
     * re-order the results to be in the order of the recently viewed, from local storage.
     * EN-17000: Note: the user can then apply a new sort onto the recently viewed results, and this
     * section will be bypassed because action.sortByRecentlyViewed will be false. See actions/cetera.js */
    if (action.sortByRecentlyViewed && window.lastAccessed && !_.isEmpty(window.lastAccessed.keys())) {
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

  if (action.type === ceteraActions.FETCH_RESULTS) {
    return {
      ...state,
      fetchingResults: true,
      fetchingResultsError: false
    };
  }

  if (action.type === ceteraActions.FETCH_RESULTS_SUCCESS) {
    return {
      ...state,
      fetchingResults: false,
      fetchingResultsError: false
    };
  }

  if (action.type === ceteraActions.FETCH_RESULTS_ERROR) {
    return {
      ...state,
      fetchingResults: false,
      fetchingResultsError: true,
      fetchingResultsErrorType: action.details
    };
  }

  if (action.type === sortActions.CHANGE_SORT_ORDER) {
    return {
      ...state,
      order: action.order
    };
  }

  if (action.type === pagerActions.CHANGE_PAGE) {
    return {
      ...state,
      pageNumber: action.pageNumber
    };
  }

  if (action.type === ceteraHelperActions.INITIAL_RESULTS_FETCHED) {
    return {
      ...state,
      initialResultsFetched: true
    };
  }

  if (action.type === pageSizeActions.UPDATE_PAGE_SIZE) {
    return {
      ...state,
      pageSize: action.pageSize
    };
  }

  return state;
};
