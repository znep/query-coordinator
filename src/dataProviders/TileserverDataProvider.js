var utils = require('socrata-utils');
var DataProvider = require('./DataProvider');
var _ = require('lodash');

var MAX_FEATURES_PER_TILE = 256 * 256;
var DEFAULT_FEATURES_PER_TILE = 50000;

const TILESERVER_HOSTS = {
  'us-west-1': [
    'https://tileserver1.api.us.socrata.com',
    'https://tileserver2.api.us.socrata.com',
    'https://tileserver3.api.us.socrata.com',
    'https://tileserver4.api.us.socrata.com'
  ]
};

/* Given a domain, fetch the tileserver hosts appropriate to that domain.
 * NOTE: Currently a stub, as we lack the API to get this information.
 * This stub won't work for EU domains.
 * See:
 *     https://socrata.atlassian.net/browse/EN-8638 and
 *     https://socrata.atlassian.net/browse/EN-8643
 */
const fetchTileserverHostsForDomain = _.memoize((domain) => {
  // Yes, this is brittle. It's probably good enough for today. Note we have no customers
  // in EU using storyteller right now. Obviously we need to make this work in EU, but it
  // isn't practical until at least EN-8638 is resolved.
  utils.assertIsOneOfTypes(domain, 'string');
  const currentWindowLocationAsTileserver = `${window.location.protocol}//${window.location.host}`;
  const isStaging = _.endsWith(domain, 'test-socrata.com');
  const isRC = _.endsWith(domain, 'rc-socrata.com');
  const hasTLD = _.includes(domain, '.');
  if (isStaging || isRC || !hasTLD) {
    if (window.location.protocol === 'file:') {
      console.warn('Attempting to load tiles from disk will fail (window.location.protocol is file:). Serve this page with HTTP instead.');
    }
    return Promise.resolve([currentWindowLocationAsTileserver]);
  } else {
    return Promise.resolve(TILESERVER_HOSTS['us-west-1']);
  }
});

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

  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');
  utils.assertHasProperty(config, 'columnName');
  utils.assertHasProperty(config, 'featuresPerTile');

  utils.assertIsOneOfTypes(config.domain, 'string');
  utils.assertIsOneOfTypes(config.datasetUid, 'string');
  utils.assertIsOneOfTypes(config.columnName, 'string');
  utils.assertIsOneOfTypes(config.featuresPerTile, 'number');

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

  function _randomNChars(n) {
    var text = '';
    var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < n; i++ ) {
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
  function _getArrayBuffer(url, configuration) {

    return (
      new Promise(
        function(resolve, reject) {
          var xhr = new XMLHttpRequest();

          function onFail() {

            return reject({
              status: parseInt(xhr.status, 10),
              headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
              config: configuration,
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
        function(error) {
          throw error;
        }
      )
    );
  }
}

module.exports = TileserverDataProvider;
