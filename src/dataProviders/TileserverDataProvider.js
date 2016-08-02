var utils = require('socrata-utils');
var DataProvider = require('./DataProvider');
var _ = require('lodash');

var MAX_FEATURES_PER_TILE = 256 * 256;
var DEFAULT_FEATURES_PER_TILE = 50000;

// These should be discovered, but see comment in
// fetchTileserverHostsForDomain. This is only
// used to enable testing on example pages.
const FALLBACK_TILESERVER_HOSTS = [
  'https://tileserver1.api.us.socrata.com',
  'https://tileserver2.api.us.socrata.com',
  'https://tileserver3.api.us.socrata.com',
  'https://tileserver4.api.us.socrata.com'
];

/* Given a domain, fetch the tileserver hosts appropriate to that domain.
 * NOTE: Currently a stub, as we lack the API to get this information (EN-8643).
 * Tileserver doesn't currently support cross-domain requests (EN-8638), but the
 * sharded (tileserver?.api.us.socrata.com) endpoints do support cross-domain
 * requests. However, we can't know for sure if it's safe to use the sharded
 * endpoints (the correct set needs to be picked on a per-domain basis, EN-8643).
 * Given this, we need to use our only remaining option, and that is to use the domain
 * the page is hosted on as the tileserver host. This will theoretically fail for a couple
 * reasons:
 *
 * 1. Map being embedded is in a different environment than the page being viewed (i.e, a
 *    map from us-west-2 being embedded in eu-west-1).
 * 2. Map is being embedded on a non-socrata page.
 *
 * Neither of these scenarios are possible today in storyteller or datalens.
 *
 * However, this will block a common and useful testing tool: the pages found in
 * examples/. We special-case these to use the sharded US tileserver hosts, which
 * are the only hosts that will work in this case. That will get testing unblocked
 * until one of the two tickets listed below are addressed in tileserver itself.
 *
 * See:
 *     https://socrata.atlassian.net/browse/EN-8638 and
 *     https://socrata.atlassian.net/browse/EN-8643
 */
const fetchTileserverHostsForDomain = _.memoize((domain) => {
  utils.assertIsOneOfTypes(domain, 'string');
  const currentWindowLocationAsTileserver = `${window.location.protocol}//${window.location.host}`;
  if (window.location.protocol === 'file:') {
    console.warn('Attempting to load tiles from disk will fail (window.location.protocol is file:). Falling back to us-west-2 tileserver hosts; these may fail.');
    return Promise.resolve(FALLBACK_TILESERVER_HOSTS);
  } else {
    return Promise.resolve([currentWindowLocationAsTileserver]);
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
