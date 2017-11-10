import url from 'url';
import _ from 'lodash';
import I18n from 'common/i18n';

let parsedCurrentUrl = null;

// 'true' here means to parse the query string into an object
function parseCurrentUrl() {
  if (_.isEmpty(parsedCurrentUrl)) {
    parsedCurrentUrl = url.parse(window.location.href, true);
  }

  return parsedCurrentUrl;
}

/** Get the URL for performing the actual catalog search */
export function getBrowseUrl(searchTerm) {
  const currentUrl = parseCurrentUrl();
  const currentUrlIsBrowse =
    currentUrl.pathname.match(new RegExp(`(\/${I18n.locale})?\/browse`));

  if (!currentUrlIsBrowse) {
    const shouldPrefixLocale = new RegExp(`^\/(${I18n.locale})`).test(currentUrl.pathname);
    currentUrl.pathname = shouldPrefixLocale ? `${`/${I18n.locale}`}/browse` : '/browse';
    currentUrl.query = { };
  }

  currentUrl.query.q = searchTerm;
  currentUrl.query.sortBy = 'relevance';

  // New search means we should return to the first page
  delete currentUrl.query.page;

  // have to blank this out to make the 'query' object get used instead
  currentUrl.search = null;

  return url.format(currentUrl);
}
// Get the URL for Cetera to perform the autocomplete search using the Rails proxy to cetera-ruby gem.
export function getCeteraUrl(searchTerm, anonymous) {
  const ceteraUrl = url.parse('/cetera/autocomplete', true);
  const currentUrl = parseCurrentUrl();

  if (!_.isEmpty(currentUrl.query)) {
    ceteraUrl.query = currentUrl.query;
  }

  if (!_.isUndefined(anonymous)) {
    ceteraUrl.query.anonymous = anonymous.toString();
  }

  ceteraUrl.query.q = escape(searchTerm);
  const formattedUrl = url.format(ceteraUrl);

  return formattedUrl;
}

export const DEFAULT_NUMBER_OF_RESULTS = 7;

export function getCeteraResults(searchTerm, callback, numberOfResults, anonymous) {
  if (_.isEmpty(searchTerm)) {
    return;
  }

  fetch(getCeteraUrl(searchTerm, anonymous), { credentials: 'same-origin' }).
  then((response) => response.json()).
  then(
    (searchResults) => {
      /*
        * We ask for way more results than we need, since each result isn't necessarily distinct
        * i.e. if you have 10 datasets called "Crime Data" and do a search that only asks for
        * top 10 results, you would only get back 1 result of "Crime Data".
        * So we ask for more than we need and only take the top n
        */
      const number = _.isEmpty(numberOfResults) ? DEFAULT_NUMBER_OF_RESULTS : numberOfResults;

      searchResults.results = _.take(searchResults.results, number);
      callback(searchResults);
    },
    (error) => console.error('Failed to fetch data', error)
  ).catch((ex) => console.error('Error parsing JSON', ex));
}
