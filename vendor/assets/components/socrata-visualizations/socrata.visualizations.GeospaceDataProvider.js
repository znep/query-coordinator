(function(root) {

  'use strict';

  if (!_.has(root, 'socrata.visualizations.DataProvider')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.DataProvider.js',
          'socrata.visualizations.GeospaceDataProvider.js'
        )
    );
  }

  var utils = root.socrata.utils;

  function GeospaceDataProvider(config) {

    _.extend(this, new root.socrata.visualizations.DataProvider(config));

    utils.assertHasProperty(config, 'domain');
    utils.assertHasProperty(config, 'datasetUid');

    utils.assertIsOneOfTypes(config.domain, 'string');
    utils.assertIsOneOfTypes(config.datasetUid, 'string');

    /**
     * Public methods
     */

    this.getFeatureExtent = function(columnName) {

      var url = 'https://{0}/resource/{1}.json?$select=extent({2})'.format(
        this.getConfigurationProperty('domain'),
        this.getConfigurationProperty('datasetUid'),
        columnName
      );
      var headers = {
        'Accept': 'application/json'
      };

      return (
        new Promise(function(resolve, reject) {

          var xhr = new XMLHttpRequest();

          function onFail() {

            var error;

            try {
              error = JSON.parse(xhr.responseText);
            } catch (e) {
              console.log(e);
              error = xhr.statusText;
            }

            return reject({
              status: parseInt(xhr.status, 10),
              message: xhr.statusText,
              soqlError: error
            });
          }

          xhr.onload = function() {

            var status = parseInt(xhr.status, 10);

            if (status === 200) {

              try {

                var responseTextWithoutNewlines = xhr.
                  responseText.
                  replace(/\n/g, '');

                var coordinates = _.get(
                  JSON.parse(responseTextWithoutNewlines),
                  '[0].extent_{0}.coordinates[0][0]'.format(columnName)
                );

                if (!_.isUndefined(coordinates)) {

                  return resolve({
                    southwest: [coordinates[0][1], coordinates[0][0]],
                    northeast: [coordinates[2][1], coordinates[2][0]]
                  });
                }
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
        })
      );
    };

    this.getShapefile = function() {
       var url = 'https://{0}/resource/{1}.geojson'.format(
        this.getConfigurationProperty('domain'),
        this.getConfigurationProperty('datasetUid')
      );
      var headers = {
        'Accept': 'application/json'
      };

      return (
        new Promise(function(resolve, reject) {

          var xhr = new XMLHttpRequest();

          function onFail() {

            var error;

            try {
              error = JSON.parse(xhr.responseText);
            } catch (e) {
              console.log(e);
              error = xhr.statusText;
            }

            return reject({
              status: parseInt(xhr.status, 10),
              message: xhr.statusText,
              soqlError: error
            });
          }

          xhr.onload = function() {

            var status = parseInt(xhr.status, 10);

            if (status === 200) {

              try {

                var responseTextWithoutNewlines = xhr.
                  responseText.
                  replace(/\n/g, '');

                resolve(JSON.parse(responseTextWithoutNewlines));

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
        })
      );
    };
  }

  root.socrata.visualizations.GeospaceDataProvider = GeospaceDataProvider;
})(window);
