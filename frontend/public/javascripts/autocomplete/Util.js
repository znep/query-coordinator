import url from 'url';
import _ from 'lodash';

let parsedCurrentUrl = undefined;

// 'true' here means to parse the query string into an object
function parseUrl() {
  if (_.isUndefined(parsedCurrentUrl)) {
    parsedCurrentUrl = url.parse(window.location.href, true);
  }

  return parsedCurrentUrl;
}

/** Get the URL for performing the actual catalog search */
export function getSearchUrl(query) {
  const currentUrl = parseUrl();

  if (currentUrl.pathname !== '/browse') {
    currentUrl.pathname = '/browse';
    currentUrl.query = { };
  }

  currentUrl.query.q = query;
  currentUrl.query.sortBy = 'relevance';
  currentUrl.query.utf8 = '✓';

  // have to blank this out to make the 'query' object get used instead
  currentUrl.search = undefined;

  return url.format(currentUrl);
}
/** Get the URL to use to hit Cetera to perform the autocomplete search */
export function getCeteraUrl(query, category) {
  let ceteraUrl = `/cetera/autocomplete?q=${escape(query)}`;

  if (!_.isEmpty(category)) {
    ceteraUrl += `&categories[]=${category}`;
  } else {
    const currentUrl = parseUrl();

    if (!_.isEmpty(currentUrl.query.category)) {
      ceteraUrl += `&categories[]=${currentUrl.query.category}`;
    }
  }

  return ceteraUrl;
}
