import 'whatwg-fetch';

const CETERA_URL = '//api.us.socrata.com/api/catalog/v1'; // TODO: get from domain config?
const DEFAULT_LIMIT = 6;
const DEFAULT_ORDER = 'relevance';

const getOffset = (pageNumber, limit) => {
  return (pageNumber - 1) * limit;
};

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    console.error(error);
    // TODO: Airbrake
  }
}

function parseJSON(response) {
  return response.json();
}

function handleError(error) {
  console.error(error);
  // TODO: Airbrake
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

      const fetchUrl = `${CETERA_URL}?${paramString}`;

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
          id: ceteraResultResource.id,
          link: ceteraResult.link,
          name: ceteraResultResource.name,
          description: ceteraResultResource.description,
          type: mapResultType(ceteraResultResource.type),
          categories: ceteraResult.classification.categories,
          tags: ceteraResult.classification.tags,
          previewImageUrl: ceteraResult.preview_image_url,
          isPublic: true, // Not implemented yet. See cetera::result_row
          isFederated: resultIsFederated(ceteraResult.metadata.domain),
          provenance: ceteraResultResource.provenance,
          createdAt: ceteraResultResource.createdAt,
          updatedAt: ceteraResultResource.updatedAt,
          viewCount: parseInt(ceteraResultResource.view_count.page_views_total, 10)
        };
      });
    }
  };
})();

export default ceteraUtils;
