var utils = require('socrata-utils');
var DataProvider = require('./DataProvider');
var _ = require('lodash');

function MetadataProvider(config) {

  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  utils.assertIsOneOfTypes(config.domain, 'string');
  utils.assertIsOneOfTypes(config.datasetUid, 'string');

  /**
   * Public methods
   */

  this.getDatasetMetadata = function() {

    var url = 'https://{0}/metadata/v1/dataset/{1}.json'.format(
      this.getConfigurationProperty('domain'),
      this.getConfigurationProperty('datasetUid')
    );
    var headers = {
      'Accept': 'application/json'
    };

    return new Promise(function(resolve, reject) {

      var xhr = new XMLHttpRequest();

      function onFail() {

        return reject({
          status: parseInt(xhr.status, 10),
          message: xhr.statusText
        });
      }

      xhr.onload = function() {

        var status = parseInt(xhr.status, 10);

        if (status === 200) {

          try {

            return resolve(
              JSON.parse(xhr.responseText)
            );
          } catch (e) {
            // Let this fall through to the `onFail()` below.
          }
        }

        onFail();
      };

      xhr.onabort = onFail;
      xhr.onerror = onFail;

      xhr.open('GET', url, true);

      // Set user-defined headers.
      _.each(headers, function(value, key) {
        xhr.setRequestHeader(key, value);
      });

      xhr.send();
    });
  };
}

module.exports = MetadataProvider;
