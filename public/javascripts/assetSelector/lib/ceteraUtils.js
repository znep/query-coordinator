import $ from 'jquery';

export const CETERA_URL = '//api.us.socrata.com/api/catalog/v1'; // TODO: get from domain config?
export const DEFAULT_LIMIT = 10;

const getOffset = (pageNumber, limit) => {
  return (pageNumber - 1) * limit;
};

const ceteraUtils = (() => {
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
        // TODO: now that this is JS and not ruby, change to camelCase?
        return {
          id: crr.id,
          link: ceteraResult.link,
          name: crr.name,
          description: crr.description,
          type: mapResultType(crr.type),
          display_title: 'display title??', // TODO: where did this come from?
          categories: ceteraResult.classification.categories,
          tags: ceteraResult.classification.tags,
          preview_image_url: ceteraResult.preview_image_url,
          is_public: true, // Not implemented yet. See cetera::result_row
          is_federated: resultIsFederated(ceteraResult.metadata.domain),
          provenance: crr.provenance,
          created_at: crr.createdAt,
          updated_at: crr.updatedAt,
          view_count: parseInt(crr.view_count.page_views_total, 10)
        };
      });
    }
  };
})();

export default ceteraUtils;
