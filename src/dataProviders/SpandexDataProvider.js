import 'whatwg-fetch';
import _ from 'lodash';
import utils from 'socrata-utils';

import DataProvider from './DataProvider';

module.exports = function SpandexDataProvider(config) {
  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  this.getSuggestions = (fieldName, searchTerm, limit) => {
    const { domain, datasetUid } = config;
    const params = `text=${searchTerm}&limit=${_.defaultTo(limit, 10)}`;
    const url = `https://${domain}/views/${datasetUid}/columns/${fieldName}/suggest?${params}`;
    return fetch(url).
      then((response) => response.json()).
      then((response) => {
        return _.chain(response).
          get('options').
          map('text').
          value();
      });
  };
};
