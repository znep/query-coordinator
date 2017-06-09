import _ from 'lodash';
import ceteraUtils from '../../common/cetera_utils';

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

const translateColumnToMixpanelEvent = (columnName) => {
  switch (columnName) {
    case 'asset type':
      return 'Sorted Assets by Asset Type';
    case 'category':
      return 'Sorted Assets By Category';
    case 'lastUpdatedDate':
      return 'Sorted Assets By Last Updated Date';
    case 'name':
      return 'Sorted Assets By Name';
    case 'owner':
      return 'Sorted Assets By Owner';
    default:
      return `Sorting by unknown column: ${columnName}`;
  }
};

const translateParamsToMixpanelEvent = (params) => {
  switch (params.action) {
    case 'TOGGLE_RECENTLY_VIEWED':
      return 'Filtered Assets to Only Recently Viewed';
    case 'CHANGE_LAST_UPDATED_DATE':
      return 'Filtered Assets by Last Updated Date';
    case 'CHANGE_ASSET_TYPE':
      return 'Filtered Assets by Asset Type';
    case 'CHANGE_AUTHORITY':
      return 'Filtered Assets by Authority';
    case 'CHANGE_CATEGORY':
      return 'Filtered Assets by Category';
    case 'CHANGE_OWNER':
      return 'Filtered Assets by Owner';
    case 'CHANGE_TAG':
      return 'Filtered Assets by Tag';
    case 'CHANGE_VISIBILITY':
      return 'Filtered Assets by Visibility';
    case 'CHANGE_Q':
      return 'Used Asset Search Field';
    case 'CHANGE_SORT_ORDER':
      return translateColumnToMixpanelEvent(params.order.value);
    default:
      return `Unknown action: ${params.action}`;
  }
};

export const fetchResults = (dispatch, getState, parameters = {}, onSuccess) => {
  dispatch(fetchingResults());

  const { assetTypes, authority, category, onlyRecentlyViewed, order, ownedBy, pageNumber, q, tag,
    visibility } = _.merge({}, getState().catalog, getState().filters, parameters);

  const ceteraOrder = () => {
    if (_.isUndefined(order)) {
      return;
    }

    const direction = order.ascending ? 'ASC' : 'DESC';
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

  let lastAccessedUids = null;

  if (window.lastAccessed) {
    lastAccessedUids = onlyRecentlyViewed ? Object.keys(window.lastAccessed.get()) : null;
  }

  return ceteraUtils.query({
    // TODO:
    // customMetadataFilters,
    q,
    category,
    forUser: _.get(ownedBy, 'id'),
    idFilters: lastAccessedUids,
    limit: RESULTS_PER_PAGE,
    mixpanelContext: {
      eventName: translateParamsToMixpanelEvent(parameters),
      params: _.omit(parameters, 'action')
    },
    only: assetTypes,
    order: ceteraOrder(),
    pageNumber,
    provenance: authority,
    showVisibility: 'true',
    tags: tag,
    visibility
  }).then((response) => {
    if (_.isObject(response)) {
      dispatch(updateCatalogResults(response, onlyRecentlyViewed));
      dispatch(fetchingResultsSuccess());
      onSuccess();
    } else {
      dispatch(fetchingResultsError());
    }
  }).catch((err) => {
    console.error(err);
    dispatch(fetchingResultsError());
  });
};

