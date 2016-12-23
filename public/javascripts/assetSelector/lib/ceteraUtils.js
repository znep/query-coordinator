import $ from 'jquery';

export const CETERA_URL = '//api.us.socrata.com/api/catalog/v1'; // TODO
export const DEFAULT_LIMIT = 10;

const getOffset = (pageNumber, limit) => {
  return (pageNumber - 1) * limit;
};

const ceteraUtils = () => {
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
    }
  };
};

export default ceteraUtils;
