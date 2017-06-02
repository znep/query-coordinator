import { fetchResults } from './cetera';

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

  const onSuccess = () => (
    dispatch({ type: 'CHANGE_SORT_ORDER', order: newOrder })
  );

  return fetchResults(dispatch, getState, { order: newOrder }, onSuccess);
};
