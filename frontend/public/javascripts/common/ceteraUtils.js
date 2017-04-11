import 'whatwg-fetch';
import airbrake from './airbrake';
import { fetchTranslation } from './locale';

/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

const CETERA_EXTERNAL_URI = window.serverConfig.ceteraExternalUri;
if (_.isEmpty(CETERA_EXTERNAL_URI)) {
  console.error('CETERA_EXTERNAL_URI is empty!');
}

const CETERA_API = `${CETERA_EXTERNAL_URI}/catalog/v1`;
const DEFAULT_LIMIT = 6;
const DEFAULT_ORDER = 'relevance';

const getOffset = (pageNumber, limit) => (pageNumber - 1) * limit;

let errorMessage;

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    errorMessage = response.statusText;

    if (response.status === 502) {
      errorMessage = fetchTranslation('manager.error.connection_502');
    }
    if (response.status === 503) {
      errorMessage = fetchTranslation('manager.error.unavailable_503');
    }
    if (response.status === 504) {
      errorMessage = fetchTranslation('manager.error.timeout_504');
    }

    console.error(errorMessage);

    error.response = response;
    try {
      airbrake.notify({
        error: `Error fetching cetera results: ${error}`,
        context: { component: 'AssetSelector' }
      });
    } catch (err) {}
    console.error(error);
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
  return errorMessage;
}

export const ceteraUtils = (() => {
  const domain = window.location.hostname; // TODO: federation?

  const assetTypeMapping = assetType => (assetType === 'new_view' ? 'datalenses' : assetType);

  return {
    fetch: ({
      category = null,
      customMetadataFilters = {},
      limit = DEFAULT_LIMIT,
      only = null,
      order = DEFAULT_ORDER,
      pageNumber = 1,
      q = null
    }) => {
      const paramObj = {
        categories: category,
        ...customMetadataFilters,
        domains: domain,
        limit,
        offset: getOffset(pageNumber, limit),
        only: assetTypeMapping(only),
        order,
        q,
        search_context: domain
      };

      const paramString = _.reduce(paramObj, function(result, value, key) {
        return (key && value) ? result += `${key}=${value}&` : result;
      }, '').slice(0, -1);

      const fetchUrl = `${CETERA_API}?${paramString}`;

      const fetchOptions = { credentials: 'same-origin' };

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
