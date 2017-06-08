import 'whatwg-fetch';
import airbrake from 'common/airbrake';
import { fetchTranslation } from './locale';

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

const CETERA_API = '/api/catalog/v1';
const DEFAULT_LIMIT = 6;
const DEFAULT_ORDER = 'relevance';

const getOffset = (pageNumber, limit) => (pageNumber - 1) * limit;

let errorMessage;

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
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

    throw errorMessage;
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
  const domain = serverConfig.domain; // TODO: federation?

  const assetTypeMapping = assetType => (assetType === 'new_view' ? 'datalenses' : assetType);

  const mapIdFiltersToParam = idFilters => _.map(idFilters, (id) => `ids=${id}`).join('&');

  return {
    fetch: ({
      category = null,
      customMetadataFilters = {},
      forUser = null,
      idFilters = [],
      limit = DEFAULT_LIMIT,
      only = null,
      order = DEFAULT_ORDER,
      pageNumber = 1,
      provenance = null,
      q = null,
      showVisibility = null,
      tags = null,
      visibility = null
    }) => {
      const paramObj = {
        categories: category,
        ...customMetadataFilters,
        domains: domain,
        for_user: forUser,
        ids: mapIdFiltersToParam(idFilters),
        limit,
        offset: getOffset(pageNumber, limit),
        only: assetTypeMapping(only),
        order,
        provenance,
        q,
        search_context: domain,
        show_visibility: showVisibility,
        tags,
        visibility
      };

      let paramString = _.reduce(_.omit(paramObj, 'ids'), function(result, value, key) {
        return (key && value) ? result += `${key}=${encodeURIComponent(value)}&` : result;
      }, '').slice(0, -1);

      if (paramObj.ids) {
        paramString += `&${paramObj.ids}`;
      }

      const fetchUrl = `${CETERA_API}?${paramString}`;

      const fetchOptions = {
        credentials: 'same-origin',
        headers: { 'X-Socrata-Host': domain }
      };

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
          link: ceteraResult.link,
          type: mapResultType(ceteraResultResource.type),
          categories: ceteraResult.classification.categories,
          tags: ceteraResult.classification.tags,
          previewImageUrl: ceteraResult.preview_image_url,
          isPublic: true, // Not implemented yet. See cetera::result_row
          isFederated: resultIsFederated(ceteraResult.metadata.domain),
          viewCount: parseInt(ceteraResultResource.view_count.page_views_total, 10)
        };
      });
    }
  };
})();

export default ceteraUtils;
