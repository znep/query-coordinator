(function(root) {

  'use strict';

  if (!_.has(root, 'socrata.visualizations.DataProvider')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.DataProvider.js',
          'socrata.visualizations.TileserverDataProvider.js'
        )
    );
  }

  var utils = root.socrata.utils;

  var MAX_FEATURES_PER_TILE = 256 * 256;
  var DEFAULT_FEATURES_PER_TILE = 50000;

  /**
   * @param {Object} config
   *   @property {String[]} tileserverHosts - An array of tileserver hostnames
   *     against which to make requests. Hostnames in this array must include
   *     a protocol (e.g. 'https://tileserver.example.com').
   *   @property {Number} [featuresPerTile] - The maximum number of features
   *     expected per tile. This defaults to (256 * 256). This value will be
   *     provided as the `LIMIT` parameter in the query string.
   *   @property {String} cname - The CNAME of the current domain. This value
   *     will be provided as the 'X-Socrata-Host' header in tile data requests.
   */
  function TileserverDataProvider(config) {

    _.extend(this, new root.socrata.visualizations.DataProvider(config));

    utils.assertHasProperty(config, 'domain');
    utils.assertHasProperty(config, 'datasetUid');
    utils.assertHasProperty(config, 'columnName');
    utils.assertHasProperty(config, 'featuresPerTile');
    utils.assertHasProperty(config, 'tileserverHosts');

    utils.assertIsOneOfTypes(config.domain, 'string');
    utils.assertIsOneOfTypes(config.datasetUid, 'string');
    utils.assertIsOneOfTypes(config.columnName, 'string');
    utils.assertIsOneOfTypes(config.featuresPerTile, 'number');
    utils.assertIsOneOfTypes(config.tileserverHosts, 'object');

    var _self = this;

    var _originHost = '{0}//{1}'.format(window.location.protocol, window.location.host);
    var _instanceRequestIdComponent = _randomNChars(16);

    /**
     * Public methods
     */

    /**
     * Curries datasetUid, columnName and whereClause into a function that can
     * be called to perform an ajax call for a vector tile
     *
     * @param {String} columnName
     * @param {String} datasetUid
     * @param {String} [whereClause]
     * @param {Boolean} [useOriginHost] - Whether or not all tiles should be
     *   requested from the origin host (as opposed to selecting one of the
     *   hosts in the `tileserverHosts` configuration property.
     *
     * @return {Function}
     */
    this.buildTileGetter = function(whereClause, useOriginHost) {

      var domain = this.getConfigurationProperty('domain');
      var datasetUid = this.getConfigurationProperty('datasetUid');
      var columnName = this.getConfigurationProperty('columnName');
      var featuresPerTile = parseInt(this.getConfigurationProperty('featuresPerTile'), 10);

      utils.assertIsOneOfTypes(whereClause, 'string', 'undefined');
      utils.assertIsOneOfTypes(useOriginHost, 'boolean', 'undefined');

      if (
        _.isNaN(featuresPerTile) ||
        featuresPerTile < 0 ||
        featuresPerTile > MAX_FEATURES_PER_TILE
      ) {

        featuresPerTile = DEFAULT_FEATURES_PER_TILE;
      }

      /**
       * Returns a promise that, when resolved, will provide error details or
       * the result of the tile data request as an ArrayBuffer.
       *
       * @param {Number} zoom
       * @param {Number} x
       * @param {Number} y
       *
       * @return {Promise}
       */
      function tileGetter(zoom, x, y) {

        utils.assertIsOneOfTypes(zoom, 'number');
        utils.assertIsOneOfTypes(x, 'number');
        utils.assertIsOneOfTypes(y, 'number');

        var url = '{0}/tiles/{1}/{2}/{3}/{4}/{5}.pbf?'.format(
          _getHost(x, y, useOriginHost),
          datasetUid,
          columnName,
          zoom,
          x,
          y
        );

        url += '$limit={0}'.format(featuresPerTile);

        if (!_.isEmpty(whereClause)) {
          url += '&$WHERE={0}'.format(whereClause);
        }

        return _getArrayBuffer(
          url,
          {
            headers: {
              'X-Socrata-Host': domain,
              'X-Socrata-RequestId': _instanceRequestIdComponent + _randomNChars(16)
            }
          }
        );
      }

      return tileGetter;
    };

    /**
     * Private methods
     */

    function _randomNChars(n) {
      var text = '';
      var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

      for (var i = 0; i < n; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      return text;
    }

    /**
     * Given the x and y values for a tile and whether to use the the origin host,
     * if there is an array of tileservers available, return one for a public
     * tileserver hosts, otherwise return the originating host
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Boolean} useOriginHost
     *
     * @return {String}
     */
    function _getHost(x, y, useOriginHost) {

      var tileserverHosts = _self.getConfigurationProperty('tileserverHosts');
      var index;
      var host;

      if (useOriginHost || _.isEmpty(tileserverHosts)) {

        host = _originHost;

      } else {

        index = (Math.abs(x) + Math.abs(y)) % tileserverHosts.length;
        host = tileserverHosts[index];
      }

      return host;
    }

    /**
     * IE9 doesn't support binary data in xhr.response, so we have to
     * use a righteous hack (See: http://stackoverflow.com/a/4330882).
     */
    function _xhrHasVBArray(xhr) {

      return (
        _.isUndefined(xhr.response) &&
        _.isDefined(window.VBArray) &&
        typeof xhr.responseBody === 'unknown' // eslint-disable-line valid-typeof
      );
    }

    function _typedArrayFromArrayBufferResponse(xhr) {

      // Handle IE.
      if (_xhrHasVBArray(xhr)) {
        return new VBArray(xhr.responseBody).toArray();
      // Fall back to default for well-behaved browsers.
      } else if (xhr.response && xhr.response instanceof ArrayBuffer) {
        return new Uint8Array(xhr.response);
      }

      return undefined;
    }

    /**
     * Makes an AJAX request for an array buffer to Socrata Tileserver.
     *
     * @param {String} url
     * @param {{headers: Object}} thisConfig
     *
     * @return {Promise}
     */
    function _getArrayBuffer(url, thisConfig) {

      return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest();

        function onFail() {

          return reject({
            status: parseInt(xhr.status, 10),
            headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
            config: thisConfig,
            statusText: xhr.statusText
          });
        }

        xhr.onload = function() {

          var arrayBuffer;
          var status = parseInt(xhr.status, 10);

          if (status === 200) {

            arrayBuffer = _typedArrayFromArrayBufferResponse(xhr);

            if (!_.isUndefined(arrayBuffer)) {

              return resolve({
                data: arrayBuffer,
                status: status,
                headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
                config: thisConfig,
                statusText: xhr.statusText
              });
            }
          }

          onFail();
        };

        xhr.onabort = onFail;
        xhr.onerror = onFail;

        xhr.open('GET', url, true);

        // Set user-defined headers.
        _.each(thisConfig.headers, function(value, key) {
          xhr.setRequestHeader(key, value);
        });

        xhr.responseType = 'arraybuffer';

        xhr.send();
      });
    }
  }

  root.socrata.visualizations.TileserverDataProvider = TileserverDataProvider;
})(window);
