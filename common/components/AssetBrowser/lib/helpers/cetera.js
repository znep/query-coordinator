import _ from 'lodash';

import { fetchJsonWithDefaultHeaders } from 'common/http';
import airbrake from 'common/airbrake';
import ceteraUtils from 'common/cetera/utils';
import * as ceteraActions from 'common/components/AssetBrowser/actions/cetera';
import { APPROVAL_STATUS_PENDING } from 'common/components/AssetBrowser/lib/constants';

export const INITIAL_RESULTS_FETCHED = 'INITIAL_RESULTS_FETCHED';
export const FETCH_INITIAL_RESULTS = 'FETCH_INITIAL_RESULTS';

import * as sortActions from 'common/components/AssetBrowser/actions/sort_order';
import * as filterActions from 'common/components/AssetBrowser/actions/filters';

export const getCurrentUserFilter = () => {
  return {
    ownedBy: {
      id: _.get(window.socrata, 'currentUser.id'),
      displayName: _.get(window.socrata, 'currentUser.displayName')
    }
  };
};

export const getCurrentUserId = () => _.get(getCurrentUserFilter(), 'ownedBy.id');

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
    case filterActions.TOGGLE_AWAITING_APPROVAL:
      return 'Filtered Assets to Only Awaiting Approval';
    case filterActions.TOGGLE_RECENTLY_VIEWED:
      return 'Filtered Assets to Only Recently Viewed';
    case filterActions.CHANGE_ASSET_TYPE:
      return 'Filtered Assets by Asset Type';
    case filterActions.CHANGE_AUTHORITY:
      return 'Filtered Assets by Authority';
    case filterActions.CHANGE_CATEGORY:
      return 'Filtered Assets by Category';
    case filterActions.CHANGE_OWNER:
      return 'Filtered Assets by Owner';
    case filterActions.CHANGE_TAG:
      return 'Filtered Assets by Tag';
    case filterActions.CHANGE_VISIBILITY:
      return 'Filtered Assets by Visibility';
    case filterActions.CHANGE_Q:
      return 'Used Asset Search Field';
    case sortActions.CHANGE_SORT_ORDER:
      return translateColumnToMixpanelEvent(params.order.value);
    case filterActions.CLEAR_ALL_FILTERS:
      return 'Clears All Asset Filters';
    case FETCH_INITIAL_RESULTS:
      return 'Fetched initial results';
    default:
      return `Unknown action: ${params.action}`;
  }
};

// This function is exported so that other services may use it to translate a given set of filters
// into the corresponding set of query parameters to pass to Cetera for search queries.
export const translateFiltersToQueryParameters = (filters) => {
  const {
    activeTab,
    approvalStatus,
    assetTypes,
    authority,
    category,
    domains,
    forUser,
    ids,
    onlyRecentlyViewed,
    order,
    ownedBy,
    pageNumber,
    pageSize,
    published,
    q,
    sharedTo,
    tag,
    visibility
  } = filters;

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

  const customMetadataFilters = (filters.action === filterActions.CLEAR_ALL_FILTERS) ?
    {} : filters.customFacets;

  return {
    approvalStatus,
    category,
    customMetadataFilters,
    domains,
    forUser: forUser || _.get(ownedBy, 'id'),
    idFilters: ids || lastAccessedUids,
    limit: pageSize,
    mixpanelContext: {
      eventName: translateParamsToMixpanelEvent(filters),
      params: _.omit(filters, 'action', 'domains')
    },
    only: assetTypes,
    order: ceteraOrder(),
    pageNumber,
    published,
    provenance: authority,
    q,
    sharedTo,
    showVisibility: 'true',
    tags: tag,
    visibility
  };
};

// Caution: If a key exists in getState().filters but is missing from parameters, then the value in the
// current state will be used instead. If you wish values in the parameters object to override the current
// state, you _must_ provide the override value in the parameters object.
export const mergedCeteraQueryParameters = (getState, parameters = {}) => {
  const activeTab = _.get(getState(), 'header.activeTab');
  const baseFilters = _.get(getState(), `assetBrowserProps.tabs.${activeTab}.props.baseFilters`);

  return translateFiltersToQueryParameters(_.merge(
    {},
    getState().catalog,
    getState().filters,
    getState().header,
    parameters,
    baseFilters
  ));
};

export const fetchAssetCounts = (dispatch, getState, parameters = {}) => {
  dispatch(ceteraActions.fetchingAssetCounts());

  // assetType:workingCopies will override this, correctly, in ceteraQueryString().
  parameters.published = true;

  return ceteraUtils.facetCountsQuery(mergedCeteraQueryParameters(getState, parameters)).then((response) => {
    if (response && _.isArray(response) && response.length > 0) {
      const datatypesFacet = _.filter(response, ((facetType) => facetType.facet === 'datatypes'))[0];

      if (datatypesFacet && _.has(datatypesFacet, 'values')) {
        dispatch(ceteraActions.fetchingAssetCountsSuccess());
        dispatch(ceteraActions.updateAssetCounts(datatypesFacet.values));
      }
    } else {
      dispatch(ceteraActions.fetchingAssetCountsError());
    }
  });
};

export const fetchProvenanceCounts = (dispatch, getState, parameters = {}) => {
  dispatch(ceteraActions.fetchingProvenanceCounts());

  return ceteraUtils.facetCountsQuery(mergedCeteraQueryParameters(getState, parameters)).then((response) => {
    if (response && _.isArray(response) && response.length > 0) {
      const provenanceFacet = _.filter(response, ((facetType) => facetType.facet === 'provenance'))[0];

      if (provenanceFacet && _.has(provenanceFacet, 'values')) {
        dispatch(ceteraActions.fetchingProvenanceCountsSuccess());
        dispatch(ceteraActions.updateProvenanceCounts(provenanceFacet.values));
      }
    } else {
      dispatch(ceteraActions.fetchingProvenanceCountsError());
    }
  });
};

// Tried to _.memoize these results, but it interfered with being able to test this functionality.
// If you feel like trying to fix that, please do. Otherwise, the call to /api/federations is pretty
// quick and small so we're not too worried about calling it every time.
const fetchFederatedDomains = () => {
  const fetchOptions = { credentials: 'same-origin' };
  return fetchJsonWithDefaultHeaders('/api/federations', fetchOptions);
};

export const fetchResults = (dispatch, getState, parameters = {}, onSuccess = _.noop) => {
  const { includeFederatedAssets } = _.merge({}, getState().assetBrowserProps, parameters);
  const { onlyRecentlyViewed } = _.merge({}, getState().filters, parameters);
  let { sortByRecentlyViewed } = _.merge({}, getState().filters, parameters);
  const currentDomain = _.get(window, 'serverConfig.domain', window.location.hostname);

  const activeTab = _.get(getState(), 'header.activeTab');

  dispatch(ceteraActions.fetchingResults());

  async function getDomains() {
    let domains = [currentDomain];

    if (includeFederatedAssets) {
      try {
        let apiResponse = await fetchFederatedDomains();
        domains = domains.concat(_.map(apiResponse, 'sourceDomainCName'));
      } catch (error) {
        // Airbrake, but don't prevent the user from getting non-federated search results
        const errorMessage = 'Error fetching federated domains for cetera results:';
        airbrake.notify({
          error: `${errorMessage} ${error}`,
          context: { component: 'AssetSelector' }
        });
        console.error(errorMessage, error);
      }
    }

    return domains;
  }

  return getDomains().
    then((domains) => {
      parameters = _.merge({}, parameters, { domains: domains.join(',') });

      return ceteraUtils.query(mergedCeteraQueryParameters(getState, parameters)).then((response) => {
        if (_.isObject(response)) {
          /* EN-17000: If user checks "Only recently viewed", any active sort is cleared and the results are
           * automatically sorted by most recently viewed (in the catalog.js reducer).
           * If the user then clicks a column to sort again, we remove the sortByRecentlyViewed override and
           * let them sort the onlyRecentlyViewed results however they want. */
          const explicitOrder = _.get(parameters, 'order') || _.get(getState(), 'catalog.order');
          sortByRecentlyViewed = sortByRecentlyViewed || (onlyRecentlyViewed && _.isEmpty(explicitOrder));

          dispatch(ceteraActions.updateCatalogResults(
            response,
            onlyRecentlyViewed,
            sortByRecentlyViewed
          ));
          dispatch(ceteraActions.fetchingResultsSuccess());
          onSuccess(response.results.length > 0);

          const showAssetCounts = _.get(getState(), 'assetBrowserProps.showAssetCounts');
          if (showAssetCounts) {
            fetchAssetCounts(dispatch, getState, parameters);
          }
          if (_.get(getState(), `assetBrowserProps.tabs[${activeTab}].props.showProvenanceCounts`) === true) {
            fetchProvenanceCounts(dispatch, getState, parameters);
          }
        } else {
          dispatch(ceteraActions.fetchingResultsError());
        }
      }).catch((err) => {
        console.error(err);
        dispatch(ceteraActions.fetchingResultsError(err.message));
      });
    });
};

export const fetchInitialResults = (parameters = {}) => (dispatch, getState) => {
  const onSuccess = () => dispatch({ type: INITIAL_RESULTS_FETCHED });
  return fetchResults(dispatch, getState, { action: FETCH_INITIAL_RESULTS, ...parameters }, onSuccess);
};
