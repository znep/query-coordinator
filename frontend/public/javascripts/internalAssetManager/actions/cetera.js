import _ from 'lodash';
import ceteraUtils from '../../common/ceteraUtils';

const RESULTS_PER_PAGE = 10;

export const updateCatalogResults = (response, onlyRecentlyViewed = false) => (
  { type: 'UPDATE_CATALOG_RESULTS', response, onlyRecentlyViewed }
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

  const { assetTypes, authority, category, onlyRecentlyViewed, order, ownedBy, pageNumber, q, tag,
    visibility } = _.merge({}, getState().catalog, getState().filters, newParamObj);

  const ceteraOrder = () => {
    if (_.isUndefined(order)) {
      return;
    }

    const direction = (order.ascending) ? 'ASC' : 'DESC';
    switch (order.value) {
      case 'category':
        return `domain_category ${direction}`;
      case 'lastUpdatedDate':
        return `updatedAt ${direction}`;
      case 'type':
        return `datatype ${direction}`;
      default:
        return `${order.value} ${direction}`;
    }
  };

  const lastAccessed = window.lastAccessed;
  let lastAccessedUids;

  if (lastAccessed) {
    lastAccessedUids = onlyRecentlyViewed ? Object.keys(lastAccessed.get()) : null;
  } else {
    lastAccessedUids = null;
  }

  return ceteraUtils.
    fetch({
      // TODO:
      // customMetadataFilters,
      q,
      category,
      forUser: _.get(ownedBy, 'id'),
      idFilters: lastAccessedUids,
      limit: RESULTS_PER_PAGE,
      only: assetTypes,
      order: ceteraOrder(),
      pageNumber,
      provenance: authority,
      showVisibility: 'true',
      tags: tag,
      visibility
    }).
    then((response) => {
      if (_.isObject(response)) {
        dispatch(updateCatalogResults(response, onlyRecentlyViewed));
        dispatch(fetchingResultsSuccess());
        onSuccess();
      } else {
        dispatch(fetchingResultsError());
      }
    }).
    catch((err) => {
      console.error(err);
      dispatch(fetchingResultsError());
    });
};
