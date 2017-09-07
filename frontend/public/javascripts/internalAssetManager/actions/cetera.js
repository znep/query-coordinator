import _ from 'lodash';
import ceteraUtils from 'common/cetera_utils';

const RESULTS_PER_PAGE = 10;

export const updateCatalogResults = (response, onlyRecentlyViewed = false, sortByRecentlyViewed = false) =>
  ({ type: 'UPDATE_CATALOG_RESULTS', response, onlyRecentlyViewed, sortByRecentlyViewed });

export const fetchingResults = () => (
  { type: 'FETCH_RESULTS' }
);

export const fetchingResultsSuccess = () => (
  { type: 'FETCH_RESULTS_SUCCESS' }
);

export const fetchingResultsError = (errMsg = null) => (
  { type: 'FETCH_RESULTS_ERROR', details: errMsg }
);

export const updateAssetCounts = (assetCounts) => (
  { type: 'UPDATE_ASSET_COUNTS', assetCounts }
);

export const fetchingAssetCounts = () => (
  { type: 'FETCH_ASSET_COUNTS' }
);

export const fetchingAssetCountsSuccess = () => (
  { type: 'FETCH_ASSET_COUNTS_SUCCESS' }
);

export const fetchingAssetCountsError = () => (
  { type: 'FETCH_ASSET_COUNTS_ERROR' }
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
    case 'CLEAR_ALL_FILTERS':
      return 'Clears All Asset Filters';
    default:
      return `Unknown action: ${params.action}`;
  }
};

// Caution: If a key exists in getState().filters but is missing from parameters, then the value in the
// current state will be used instead. If you wish values in the parameters object to override the current
// state, you _must_ provide the override value in the parameters object.
export const ceteraUtilsParams = (getState, parameters = {}) => {
  const {
    activeTab,
    assetTypes,
    authority,
    category,
    onlyRecentlyViewed,
    order,
    ownedBy,
    pageNumber,
    published,
    q,
    tag,
    visibility } = _.merge({}, getState().catalog, getState().filters, getState().header, parameters);

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

  let forUser = _.get(ownedBy, 'id');
  if (activeTab === 'myAssets') {
    forUser = _.get(window, 'serverConfig.currentUser.id');
  }

  const customMetadataFilters = (parameters.action === 'CLEAR_ALL_FILTERS') ? {} :
    _.merge({}, _.get(getState(), 'filters.customFacets'), parameters.customFacets);

  return {
    category,
    customMetadataFilters,
    forUser,
    idFilters: lastAccessedUids,
    limit: RESULTS_PER_PAGE,
    mixpanelContext: {
      eventName: translateParamsToMixpanelEvent(parameters),
      params: _.omit(parameters, 'action')
    },
    only: assetTypes,
    order: ceteraOrder(),
    pageNumber,
    published,
    provenance: authority,
    q,
    showVisibility: 'true',
    tags: tag,
    visibility
  };
};

export const fetchAssetCounts = (dispatch, getState, parameters = {}) => {
  dispatch(fetchingAssetCounts());

  // assetType:workingCopies will override this, correctly, in ceteraQueryString().
  parameters.published = true;

  return ceteraUtils.facetCountsQuery(ceteraUtilsParams(getState, parameters)).then((response) => {
    if (response && _.isArray(response) && response.length > 0) {
      const datatypesFacet = _.filter(response, ((facetType) => facetType.facet === 'datatypes'))[0];

      if (datatypesFacet && _.has(datatypesFacet, 'values')) {
        dispatch(fetchingAssetCountsSuccess());
        dispatch(updateAssetCounts(datatypesFacet.values));
      }
    } else {
      dispatch(fetchingAssetCountsError());
    }
  });
};

export const fetchResults = (dispatch, getState, parameters = {}, onSuccess) => {
  const { onlyRecentlyViewed } = _.merge({}, getState().filters, parameters);
  let { sortByRecentlyViewed } = _.merge({}, getState().filters, parameters);

  dispatch(fetchingResults());

  return ceteraUtils.query(ceteraUtilsParams(getState, parameters)).then((response) => {
    if (_.isObject(response)) {
      /* EN-17000: If user checks "Only recently viewed", any active sort is cleared and the results are
       * automatically sorted by most recently viewed (in the catalog.js reducer).
       * If the user then clicks a column to sort again, we remove the sortByRecentlyViewed override and
       * let them sort the onlyRecentlyViewed results however they want. */
      const explicitOrder = _.get(parameters, 'order') || _.get(getState(), 'catalog.order');
      sortByRecentlyViewed = sortByRecentlyViewed || (onlyRecentlyViewed && _.isEmpty(explicitOrder));

      dispatch(updateCatalogResults(response, onlyRecentlyViewed, sortByRecentlyViewed));
      dispatch(fetchingResultsSuccess());
      onSuccess();

      fetchAssetCounts(dispatch, getState, parameters);
    } else {
      dispatch(fetchingResultsError());
    }
  }).catch((err) => {
    console.error(err);
    dispatch(fetchingResultsError(err.message));
  });
};
