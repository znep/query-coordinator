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
    utils.assertHasProperty(config, 'fourByFour');
    utils.assertHasProperty(config, 'fieldName');

    utils.assertIsOneOfTypes(config.domain, 'string');
    utils.assertIsOneOfTypes(config.fourByFour, 'string');
    utils.assertIsOneOfTypes(config.fieldName, 'string');

    var _self = this;

    /**
     * Public methods
     */

    this.getFeatureExtent = function() {

      var url= 'https://{0}/resource/{1}.json?$select=extent({2})'.format(
        this.getConfigurationProperty('domain'),
        this.getConfigurationProperty('fourByFour'),
        this.getConfigurationProperty('fieldName')
      );
      var headers = {
        'Accept': 'application/json'
      };

      return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest();

        function onFail() {

          reject({
            status: parseInt(xhr.status, 10),
            headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
            config: config,
            statusText: xhr.statusText
          });
        }

        xhr.onload = function() {

          var status = parseInt(xhr.status, 10);

          if (status === 200) {

            try {

              var coordinates = _.get(
                JSON.parse(xhr.responseText),
                '[0].extent_{0}.coordinates[0][0]'.format(config.fieldName)
              );

              if (!_.isUndefined(coordinates)) {

                var extent = {
                  southwest: [coordinates[0][1], coordinates[0][0]],
                  northeast: [coordinates[2][1], coordinates[2][0]]
                };

                resolve({
                  data: extent,
                  status: status,
                  headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
                  config: config,
                  statusText: xhr.statusText
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
      });
    }
  }

  root.socrata.visualizations.GeospaceDataProvider = GeospaceDataProvider;
})(window);
