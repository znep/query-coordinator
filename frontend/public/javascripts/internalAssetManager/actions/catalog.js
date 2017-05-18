import _ from 'lodash';
import ceteraUtils from '../../common/ceteraUtils';

const RESULTS_PER_PAGE = 10;

export const updateCatalogResults = (response) => (
  { type: 'UPDATE_CATALOG_RESULTS', response }
);

export const fetchingResults = () => (
  { type: 'FETCH_RESULTS' }
);

export const fetchingResultsSuccess = () => (
  { type: 'FETCH_RESULTS_SUCCESS' }
);

export const fetchingResultsError = () => (
  { type: 'FETCH_RESULTS_ERROR' }
);

export const fetchResults = (dispatch, getState, newParamObj = {}, onSuccess) => {
  dispatch(fetchingResults());

  const { currentPage, order } = _.merge({}, getState().catalog, newParamObj);

  const ceteraOrder = () => {
    if (_.isUndefined(order)) {
      return;
    }

    const direction = (order.ascending) ? 'ASC' : 'DESC';
    switch (order.value) {
      case 'name':
        return `name ${direction}`;
      case 'lastUpdatedDate':
        return `updatedAt ${direction}`;
      // TODO: add more cases to map orderBy's when they become available in Cetera
      default:
        return `${order.value} ${direction}`;
    }
  };

  return ceteraUtils.
    fetch({
      // TODO:
      // category
      // customMetadataFilters,
      // only,
      // q,
      limit: RESULTS_PER_PAGE,
      order: ceteraOrder(),
      pageNumber: currentPage,
      showVisibility: true
    }).
    then((response) => {
      if (_.isObject(response)) {
        dispatch(updateCatalogResults(response));
        dispatch(fetchingResultsSuccess());
        onSuccess();
      } else {
        dispatch(fetchingResultsError());
      }
    }).
    catch(() => {
      dispatch(fetchingResultsError());
    });
};

export const changePage = (pageNumber) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_PAGE', pageNumber });
  };

  return fetchResults(dispatch, getState, { currentPage: pageNumber }, onSuccess);
};

export const changeOrder = (columnName) => (dispatch, getState) => {
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
    dispatch({ type: 'CHANGE_ORDER', order: newOrder })
  );

  return fetchResults(dispatch, getState, { order: newOrder }, onSuccess);
};
