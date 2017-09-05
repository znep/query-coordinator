import _ from 'lodash';
import url from 'url';

export const updateQueryString = ({ getState, shouldClearSearch = false }) => {
  if (_.get(window, 'history.pushState')) {
    const location = window.location;
    const urlPath = `${location.protocol}//${location.host}${location.pathname}`;

    const activeFilters = _(_.clone(getState().filters)).
      toPairs().
      // Only a whitelist of filter keys
      filter((filterTypeAndValue) => _.includes(
        ['assetTypes', 'authority', 'category', 'customFacets', 'q', 'tag', 'visibility'],
        filterTypeAndValue[0])
      ).
      // map the customFacets object to a flattened array, so each custom facet appears as its own query param
      map((filterTypeAndValue) => {
        if (filterTypeAndValue) {
          const [filterType, filterValue] = filterTypeAndValue;
          if (filterType === 'customFacets' && !_.isEmpty(filterValue)) {
            return _(filterValue).toPairs().flatten().value();
          }
        }
        return filterTypeAndValue;
      }).
      // Only filters with values present
      filter((filterTypeAndValue) => !_.isEmpty(filterTypeAndValue[1])).
      fromPairs().
      value();

    // ownedBy is an object that we need to split up into separate query params
    const ownedBy = _.get(getState(), 'filters.ownedBy');
    if (ownedBy && ownedBy.id) {
      activeFilters.ownerId = ownedBy.id;
      activeFilters.ownerName = ownedBy.displayName;
    }

    // current page
    const pageNumber = _.get(getState(), 'catalog.pageNumber');
    if (pageNumber && pageNumber > 1) {
      activeFilters.page = pageNumber;
    }

    // sort order
    const order = _.get(getState(), 'catalog.order');
    if (!_.isEmpty(order)) {
      activeFilters.orderColumn = order.value;
      activeFilters.orderDirection = order.ascending ? 'asc' : 'desc';
    }

    // search query
    if (shouldClearSearch) {
      delete activeFilters.q;
    }

    // active tab
    const activeTab = _.get(getState(), 'header.activeTab');
    if (!_.isEmpty(activeTab)) {
      activeFilters.tab = activeTab;
    }

    const queryString = _(activeFilters).map((value, type) => `${type}=${value}`).value().join('&');
    const newUrl = `${urlPath}?${queryString}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }
};

export const getQueryParameter = ({ key, defaultValue }) => {
  return _.get(url.parse(window.location.href, true), `query.${key}`, defaultValue);
};
