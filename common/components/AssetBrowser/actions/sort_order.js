import _ from 'lodash';
import { fetchResults } from 'common/components/AssetBrowser/lib/helpers/cetera';
import { clearPage } from './pager';
import { updateQueryString } from 'common/components/AssetBrowser/lib/query_string';

export const CHANGE_SORT_ORDER = 'CHANGE_SORT_ORDER';

export const changeSortOrder = (selection) => (dispatch, getState) => {
  const sortOptionsThatDefaultToDescending = ['lastUpdatedDate', 'createdAt'];
  let newOrder;

  if (_.get(getState(), 'assetBrowserProps.renderStyle') === 'card') { // Sorting via sort_dropdown
    newOrder = {
      value: selection.value,
      ascending: !_.includes(sortOptionsThatDefaultToDescending, selection.value)
    };
  } else { // Sorting via column header
    // If the user clicks on the column name already being sorted on, then toggle ascending/descending.
    const currentStateOrder = _.get(getState(), 'catalog.order', {});

    const defaultToAscending = !_.includes(sortOptionsThatDefaultToDescending, selection);

    const ascending = (selection === currentStateOrder.value) ?
      !currentStateOrder.ascending : defaultToAscending;
    newOrder = {
      value: selection,
      ascending
    };
  }

  const onSuccess = () => {
    dispatch({ type: CHANGE_SORT_ORDER, order: newOrder });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  return fetchResults(
    dispatch,
    getState,
    {
      action: CHANGE_SORT_ORDER,
      order: newOrder,
      pageNumber: 1
    },
    onSuccess
  );
};

export const clearSortOrder = () => (
  { type: CHANGE_SORT_ORDER, order: undefined }
);
