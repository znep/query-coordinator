import 'whatwg-fetch';
import airbrake from './airbrake';

const CETERA_URI = `${window.serverConfig.ceteraUri}/catalog/v1`;
const DEFAULT_LIMIT = 6;
const DEFAULT_ORDER = 'relevance';

const getOffset = (pageNumber, limit) => (pageNumber - 1) * limit;

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    airbrake.notify({
      error: `Error fetching cetera results: ${error}`,
      context: { component: 'AssetSelector' }
    });
    console.error(error);
  }
}

function parseJSON(response) {
  return response.json();
}

function handleError(error) {
  airbrake.notify({
    error: `Error fetching cetera results: ${error}`,
    context: { component: 'AssetSelector' }
  });
  console.error(error);
}

export const ceteraUtils = (() => {
  const domain = window.location.hostname; // TODO: federation?

  return {
    fetch: ({ category = null, limit = DEFAULT_LIMIT, order = DEFAULT_ORDER, pageNumber = 1 }) => {
      const paramObj = {
        domains: domain,
        search_context: domain,
        categories: category,
        limit,
        order,
        offset: getOffset(pageNumber, limit)
      };

      const paramString = _.reduce(paramObj, function(result, value, key) {
        return (key && value) ? result += `${key}=${value}&` : result;
      }, '').slice(0, -1);

      const fetchUrl = `${CETERA_URI}?${paramString}`;

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
          ..._.pick(
            ceteraResultResource, 'id', 'name', 'description', 'provenance', 'createdAt', 'updatedAt'
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
