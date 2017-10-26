var utils = require('common/js_utils');
var DataProvider = require('./DataProvider');
var _ = require('lodash');

var MAX_FEATURES_PER_TILE = 256 * 256;
var DEFAULT_FEATURES_PER_TILE = 50000;

/**
 * @param {Object} config
 *   @property {String} [datasetUid] - The dataset to read.
 *   @property {String} [columnName] - The column to read in the dataset.
 *   @property {String} domain - The domain the dataset resides on. This value
 *     will be provided as the 'X-Socrata-Host' header in tile data requests.
 *   @property {Number} [featuresPerTile] - The maximum number of features
 *     expected per tile. This defaults to (256 * 256). This value will be
 *     provided as the `LIMIT` parameter in the query string.
 */
function TileserverDataProvider(config, useCache = false) {

  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');
  utils.assertHasProperty(config, 'columnName');
  utils.assertHasProperty(config, 'featuresPerTile');

  utils.assertIsOneOfTypes(config.domain, 'string');
  utils.assertIsOneOfTypes(config.datasetUid, 'string');
  utils.assertIsOneOfTypes(config.columnName, 'string');
  utils.assertIsOneOfTypes(config.featuresPerTile, 'number');

  if (useCache) {
    const cached = this.cachedInstance('TileserverDataProvider');
    if (cached) {
      return cached;
    }
  }

  var _self = this;

  var _instanceRequestIdComponent = _randomNChars(16);

  /**
   * Public methods
   */

  /**
   * Returns a function that can be called to perform an ajax call for a vector tile
   *
   * @param {String} whereClause
   * @return {Function}
   */
  this.buildTileGetter = function(whereClause) {

    var domain = this.getConfigurationProperty('domain');
    var datasetUid = this.getConfigurationProperty('datasetUid');
    var columnName = this.getConfigurationProperty('columnName');
    var featuresPerTile = parseInt(this.getConfigurationProperty('featuresPerTile'), 10);

    utils.assertIsOneOfTypes(domain, 'string');
    utils.assertIsOneOfTypes(whereClause, 'string', 'undefined');

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

      return fetchTileserverHostsForDomain(domain).then((tileserverHosts) => {
        const host = _getHost(x, y, tileserverHosts);
        var url = `${host}/tiles/${datasetUid}/${columnName}/${zoom}/${x}/${y}.pbf?`;

        url += `$limit=${featuresPerTile}`;

        if (!_.isEmpty(whereClause)) {
          url += `&$where=${whereClause}`;
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
      });
    }

    return tileGetter;
  };

  /**
   * Private methods
   */

  /* Given a domain, fetch the tileserver hosts appropriate to that domain.
   * NOTE: Currently a stub, as we lack the API to get this information (EN-8643).
   * We can't know for sure if it's safe to use the sharded endpoints (the correct
   * set needs to be picked on a per-domain basis, EN-8643).
   *
   * In absence of this API, we must use the domain the dataset is on as the tileserver
   * host. This is not ideal, as the browser will limit the number of concurrent requests
   * to a single domain (the sharded hosts get around this by having many domains).
   *
   * See:
   *     https://socrata.atlassian.net/browse/EN-8643
   */
  const fetchTileserverHostsForDomain = (domain) => {
    utils.assertIsOneOfTypes(domain, 'string');
    return Promise.resolve([`https://${domain}`]);
  };

  function _randomNChars(n) {
    var text = '';
    var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < n; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  /**
   * Returns a tileserver host given the x and y values for a tile
   * and a list of tileserver hosts.
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Array[String]} tileserverHosts
   *
   * @return {String}
   */
  function _getHost(x, y, tileserverHosts) {
    const index = (Math.abs(x) + Math.abs(y)) % tileserverHosts.length;
    return tileserverHosts[index];
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
   * @param {{headers: Object}} configuration
   *
   * @return {Promise}
   */
  const arrayBufferPromiseCache = {};
  function _getArrayBuffer(url, configuration) {

    const cacheKey = url;

    const cachedPromise = arrayBufferPromiseCache[cacheKey];
    if (cachedPromise) {
      return cachedPromise;
    }

    const loadTilesPromise = new Promise(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();

        function onFail() {
          return reject({
            status: parseInt(xhr.status, 10),
            headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
            config: configuration,
            statusText: xhr.statusText
          });
        }

        xhr.onload = function() {
          const status = parseInt(xhr.status, 10);
          if (status === 200) {
            const arrayBuffer = _typedArrayFromArrayBufferResponse(xhr);
            if (!_.isUndefined(arrayBuffer)) {
              return resolve({
                data: arrayBuffer,
                status: status,
                headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
                config: configuration,
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
        _.each(configuration.headers, function(value, key) {
          xhr.setRequestHeader(key, value);
        });

        xhr.responseType = 'arraybuffer';

        xhr.send();
      }
    ).catch(
      (error) => {
        throw error;
      }
    );

    arrayBufferPromiseCache[cacheKey] = loadTilesPromise;

    return loadTilesPromise;

  }

}

module.exports = TileserverDataProvider;
