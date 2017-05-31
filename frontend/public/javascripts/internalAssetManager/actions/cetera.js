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

  const { assetTypes, currentPage, order, visibility } =
    _.merge({}, getState().catalog, getState().filters, newParamObj);

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
      // q,
      limit: RESULTS_PER_PAGE,
      only: assetTypes,
      order: ceteraOrder(),
      pageNumber: currentPage,
      showVisibility: 'true',
      visibility
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
