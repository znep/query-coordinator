(function(root) {

  'use strict';

  if (!_.has(root, 'socrata.visualizations.DataProvider')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.DataProvider.js',
          'socrata.visualizations.SocrataTileserverDataProvider.js'
        )
    );
  }

  var utils = root.socrata.utils;

  function GeospaceDataProvider(config) {

    var _self = this;

    _.extend(this, new root.socrata.visualizations.DataProvider(config));

    /**
     * Public methods
     */

    this.getFeatureExtent = function(config) {

      var url= '{0}/resource/{1}.json?$select=extent({2})'.format(
        config.domain,
        config.fourByFour,
        config.fieldName
      );

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
        _.each(config.headers, function(value, key) {
          xhr.setRequestHeader(key, value);
        });

        xhr.send();
      });
    }
  }

  root.socrata.visualizations.GeospaceDataProvider = GeospaceDataProvider;
})(window);
