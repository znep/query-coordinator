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

  // New search means we should return to the first page
  delete currentUrl.query.page;

  // have to blank this out to make the 'query' object get used instead
  currentUrl.search = undefined;

  return url.format(currentUrl);
}
/** Get the URL to use to hit Cetera to perform the autocomplete search */
export function getCeteraUrl(query, category, anonymous) {
  let ceteraUrl = `/cetera/autocomplete?q=${escape(query)}`;

  if (!_.isEmpty(category)) {
    ceteraUrl += `&categories[]=${category}`;
  } else {
    const currentUrl = parseUrl();

    if (!_.isEmpty(currentUrl.query.category)) {
      ceteraUrl += `&categories[]=${currentUrl.query.category}`;
    }
  }

  if (!_.isUndefined(anonymous)) {
    ceteraUrl += `&anonymous=${anonymous}`;
  }

  return ceteraUrl;
}

const DEFAULT_NUMBER_OF_RESULTS = 7;

export function getCeteraResults(query, callback, numberOfResults, anonymous) {
  if (_.isEmpty(query)) {
    return;
  }

  fetch(getCeteraUrl(query, undefined, anonymous), { credentials: 'same-origin' }).
  then((response) => response.json()).
  then(
    (searchResults) => {
      /*
        * We ask for way more results than we need, since each result isn't necessarily distinct
        * i.e. if you have 10 datasets called "Crime Data" and do a search that only asks for
        * top 10 results, you would only get back 1 result of "Crime Data".
        * So we ask for more than we need and only take the top n
        */
      const number = _.isUndefined(numberOfResults) ? DEFAULT_NUMBER_OF_RESULTS : numberOfResults;

      searchResults.results = _.take(searchResults.results, number);
      callback(searchResults);
    },
    (error) => {
      console.error('Failed to fetch data', error);
    }
  ).catch((ex) => console.error('Error parsing JSON', ex));
}
