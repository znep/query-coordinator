import _ from 'lodash';
import 'whatwg-fetch';

import utils from 'common/js_utils';
import { checkStatus } from 'common/http';

// Provider for API access to Spandex in-dataset autocomplete.
class SpandexDataProvider {
  constructor(config) {
    utils.assertHasProperty(config, 'datasetUid');
    utils.assertHasProperty(config, 'domain');

    const { datasetUid, domain } = config;
    this.datasetUid = datasetUid;
    this.domain = domain;
  }

  fetchSuggestions(fieldName, searchTerm, limit = 10) {
    const url = new URL(
      `https://${this.domain}/views/${this.datasetUid}/columns/${fieldName}/suggest`
    );
    url.searchParams.append('text', searchTerm);
    url.searchParams.append('limit', limit);
    const fetchOptions = { credentials: 'include' };

    return fetch(url, fetchOptions).
      then(checkStatus).
      then(response => response.json()).
      then(response => _.map(response.options, 'text'));
  }
}

export default SpandexDataProvider;
