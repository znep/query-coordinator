import 'whatwg-fetch';
import _ from 'lodash';
import airbrake from 'common/airbrake';
import mixpanel from 'common/mixpanel';
import { fetchTranslation } from 'common/locale';

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

const CETERA_CATALOG_PATH = '/api/catalog/v1';
const CETERA_USER_PATH = `${CETERA_CATALOG_PATH}/users`;
const CETERA_AUTOCOMPLETE_PATH = `${CETERA_CATALOG_PATH}/autocomplete`;
const CETERA_DOMAINS_PATH = `${CETERA_CATALOG_PATH}/domains`;
const DEFAULT_LIMIT = 6;
const DEFAULT_ORDER = 'relevance';

const getOffset = (pageNumber, limit) => (pageNumber - 1) * limit;

let errorMessage;

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    if (response.status === 400) {
      return response.json().then((json) => {
        if (json.error === 'Sum of `offset` and `limit` cannot exceed 10000') {
          throw new Error('offset_too_large');
        }
      });
    }

    errorMessage = response.statusText;

    if (response.status === 502) {
      errorMessage = fetchTranslation('common.error.connection_502');
    }
    if (response.status === 503) {
      errorMessage = fetchTranslation('common.error.unavailable_503');
    }
    if (response.status === 504) {
      errorMessage = fetchTranslation('common.error.timeout_504');
    }

    try {
      airbrake.notify({
        error: `Error fetching cetera results: ${errorMessage}`,
        context: { component: 'AssetSelector' }
      });
    } catch (err) {}

    throw new Error(errorMessage);
  }
}

function parseJSON(response) {
  return response.json();
}

function handleError(error) {
  try {
    airbrake.notify({
      error: `Error fetching cetera results: ${error}`,
      context: { component: 'AssetSelector' }
    });
  } catch (err) {}
  console.error(error);
  throw error;
}

export const ceteraUtils = (() => {
  if (_.isUndefined(window.serverConfig)) {
    console.warn('WARNING: window.serverConfig is undefined.');
  }

  const domain = _.get(window, 'serverConfig.domain'); // TODO: federation?

  const assetTypeMapping = (assetType) => (assetType === 'new_view' ? 'datalenses' : assetType);

  const mapIdFiltersToParam = (idFilters) => _.map(idFilters, (id) => `ids=${id}`).join('&');

  const fetchOptions = {
    credentials: 'same-origin',
    headers: {
      'X-Socrata-Host': domain,
      'User-Agent': 'SocrataFrontend/1.0 (+https://socrata.com/)'
    }
  };

  // Query param string used for multiple Cetera queries (results query, facet counts query).
  const ceteraQueryString = ({
    category = null,
    customMetadataFilters = {},
    derivedFrom = null,
    forUser = null,
    idFilters = [],
    limit = DEFAULT_LIMIT,
    only = null,
    order = DEFAULT_ORDER,
    pageNumber = 1,
    provenance = null,
    published = null,
    q = null,
    sharedTo = null,
    showVisibility = null,
    tags = null,
    visibility = null
  }) => {
    const parameters = {
      categories: category,
      ...customMetadataFilters,
      derived_from: derivedFrom,
      domains: domain,
      for_user: forUser,
      ids: mapIdFiltersToParam(idFilters),
      limit,
      offset: getOffset(pageNumber, limit),
      only: assetTypeMapping(only),
      order,
      published,
      provenance,
      q,
      search_context: domain,
      shared_to: sharedTo,
      show_visibility: showVisibility,
      tags,
      visibility
    };

    /*
     * Note, changes to filters and search options here must match the corresponding implementation in
     * platform-ui/frontend/app/controllers/internal_asset_manager_controller.rb
     */

    // Special-case "working copies" because they're not an asset type, but a subset of
    // an asset type with an extra condition attached. This will totally not come back
    // to bite us if we add a filter for un/published.
    if (only === 'workingCopies') {
      parameters.only = 'datasets';
      parameters.published = 'false';
    } else if (parameters.only === 'datasets') {
      // When we're searching for plain old datasets, we need to omit the working copies
      parameters.published = 'true';
    }

    const reduceUriEncodedQueryParameter = (result, value, key) => {
      if (!_.isNull(key) && !_.isNull(value)) {
        return result.concat([`${key}=${encodeURIComponent(value)}`]);
      } else {
        return result;
      }
    };

    return _.reduce(_.omit(parameters, 'ids'), reduceUriEncodedQueryParameter, []).
      concat(parameters.ids ? [`${parameters.ids}`] : []).join('&');
  };

  return {
    ceteraQueryString,
    query: (queryOptions) => {
      const { mixpanelContext } = queryOptions;

      if (!mixpanelContext) {
        console.warn(`No mixpanelContext provided. Mixpanel events may not be reported properly. Consider
          adding mixpanelContext to this cetera query.`);
      }

      const queryString = ceteraQueryString(queryOptions);
      const fetchUrl = `${CETERA_CATALOG_PATH}?${queryString}`;

      const reportToMixpanel = (json) => {
        if (mixpanelContext) {
          mixpanel.sendPayload(
            mixpanelContext.eventName,
            {
              'Result Count': json.results.length,
              ..._.omit(mixpanelContext.params, 'results')
            }
          );
        }
        return json;
      };

      // Calls whatwg-fetch and returns the promise
      return fetch(fetchUrl, fetchOptions).
        then(checkStatus).
        then(parseJSON).
        then(reportToMixpanel).
        catch(handleError);
    },

    facetCountsQuery: (queryOptions) => {
      const queryString = ceteraQueryString(queryOptions);
      const ceteraFacetsPath = `${CETERA_DOMAINS_PATH}/${domain}/facets`;
      const fetchUrl = `${ceteraFacetsPath}?${queryString}`;

      // Calls whatwg-fetch and returns the promise
      return fetch(fetchUrl, fetchOptions).
        then(checkStatus).
        then(parseJSON).
        catch(handleError);
    },

    domainUsersQuery: (queryOptions) => {
      const queryString = ceteraQueryString(queryOptions);
      const fetchUrl = `${CETERA_USER_PATH}?${queryString}`;

      return fetch(fetchUrl, fetchOptions).
        then(checkStatus).
        then(parseJSON).
        catch(handleError);
    },

    autocompleteQuery: (searchTerm, otherFilters = {}) => {
      const queryString = ceteraQueryString({...otherFilters, q: searchTerm });
      const fetchUrl = `${CETERA_AUTOCOMPLETE_PATH}?${queryString}`;

      return fetch(fetchUrl, fetchOptions).
        then(checkStatus).
        then(parseJSON).
        catch(handleError);
    },

    mapToAssetSelectorResult: (ceteraResults) => {
      const mapResultType = (type) => {
        // :sadpanda:
        return (type === 'datalens') ? 'data_lens' : type;
      };

      const resultIsFederated = (resultDomain) => {
        return resultDomain !== window.location.hostname;
      };

      return ceteraResults.map((ceteraResult) => {
        const ceteraResultResource = ceteraResult.resource;

        return {
          _resource: ceteraResultResource,
          ..._.pick(
            ceteraResultResource, 'id', 'uid', 'name', 'description', 'provenance', 'createdAt', 'updatedAt'
          ),
          categories: ceteraResult.classification.categories,
          isFederated: resultIsFederated(ceteraResult.metadata.domain),
          isPublic: true, // Not implemented yet. See cetera::result_row
          link: ceteraResult.link,
          previewImageUrl: ceteraResult.preview_image_url,
          tags: ceteraResult.classification.tags,
          type: mapResultType(ceteraResultResource.type),
          viewCount: parseInt(ceteraResultResource.view_count.page_views_total, 10)
        };
      });
    }
  };
})();

export default ceteraUtils;