import _ from 'lodash';
import { fetchResults } from 'common/components/AssetBrowser/lib/helpers/cetera';
import { clearPage } from './pager';
import { updateQueryString } from 'common/components/AssetBrowser/lib/query_string';

export const changeSortOrder = (columnName) => (dispatch, getState) => {
  // If the user clicks on the column name already being sorted on, then toggle ascending/descending.
  const currentStateOrder = _.get(getState(), 'catalog.order', {});

  const columnsThatDefaultToDescending = ['lastUpdatedDate'];
  const defaultToAscending = !_.includes(columnsThatDefaultToDescending, columnName);

  const ascending = (columnName === currentStateOrder.value) ?
    !currentStateOrder.ascending : defaultToAscending;
  const newOrder = {
    value: columnName,
    ascending
  };

  const onSuccess = () => {
    dispatch({ type: 'CHANGE_SORT_ORDER', order: newOrder });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  return fetchResults(
    dispatch,
    getState,
    {
      action: 'CHANGE_SORT_ORDER',
      order: newOrder,
      pageNumber: 1
    },
    onSuccess
  );
};

export const clearSortOrder = () => (
  { type: 'CHANGE_SORT_ORDER', order: undefined }
);
