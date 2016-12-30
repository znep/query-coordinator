import $ from 'jquery';

export const CETERA_URL = '//api.us.socrata.com/api/catalog/v1'; // TODO: get from domain config?
export const DEFAULT_LIMIT = 9;

const getOffset = (pageNumber, limit) => {
  return (pageNumber - 1) * limit;
};

export const ceteraUtils = (() => {
  const domain = window.location.hostname; // TODO: federation?

  return {
    fetch: ({ pageNumber = 1, limit = DEFAULT_LIMIT }) => {
      const queryString = $.param({
        domains: domain,
        search_context: domain,
        limit: limit,
        offset: getOffset(pageNumber, limit)
      });

      return $.ajax({
        url: `${CETERA_URL}?${queryString}`,
        dataType: 'json'
      });
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
        const crr = ceteraResult.resource;

        return {
          id: crr.id,
          link: ceteraResult.link,
          name: crr.name,
          description: crr.description,
          type: mapResultType(crr.type),
          categories: ceteraResult.classification.categories,
          tags: ceteraResult.classification.tags,
          previewImageUrl: ceteraResult.preview_image_url,
          isPublic: true, // Not implemented yet. See cetera::result_row
          isFederated: resultIsFederated(ceteraResult.metadata.domain),
          provenance: crr.provenance,
          createdAt: crr.createdAt,
          updatedAt: crr.updatedAt,
          viewCount: parseInt(crr.view_count.page_views_total, 10)
        };
      });
    }
  };
})();

export default ceteraUtils;
