(function() {
  'use strict';

  var lowercase = angular.lowercase;
  var forEach = angular.forEach;
  var MAX_FEATURES_PER_TILE = 256 * 256;
  var DEFAULT_FEATURES_PER_TILE = 50000;

  /**
   * Standalone string trim, borrowed from angular
   * @param {*} value
   * @returns {*}
   */
  function trim(value) {
    return _.isString(value) ? value.trim() : value;
  }

  function VectorTileDataService(RequestId, ServerConfig, $q) {
    var VectorTileDataService = {};
    var tileserverHosts = ServerConfig.get('tileserverHosts');
    var originHost = $.baseUrl().host;
    /**
     * Given the x and y values for a tile and whether to use the the origin host,
     * if there is an array of tileservers available, return one for a public
     * tileserver hosts, otherwise return the originating host
     * @param {Number} x
     * @param {Number} y
     * @param {Boolean} [useOriginHost]
     * @returns {String}
     */
    VectorTileDataService.getHost = function getHost(x, y, useOriginHost) {
      if (useOriginHost || _.isEmpty(tileserverHosts)) {
        return originHost;
      } else {
        var index = (Math.abs(x) + Math.abs(y)) % tileserverHosts.length;
        return tileserverHosts[index];
      }
    };

    /**
     * Parse headers into key value object (borrowed from Angular)
     *
     * @param {string} headers Raw headers as a string
     * @returns {Object} Parsed headers as key value object
     */
    function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var colonIndex;

      if (!headers) return parsed;

      forEach(headers.split('\n'), function(line) {
        colonIndex = line.indexOf(':');
        key = lowercase(trim(line.substr(0, colonIndex)));
        val = trim(line.substr(colonIndex + 1));

        if (key) {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      });

      return parsed;
    }

    // IE9 doesn't support binary data in xhr.response, so we have to
    // use a righteous hack (See: http://stackoverflow.com/a/4330882).
    function xhrHasVBArray(xhr) {
      return _.isUndefined(xhr.response) &&
        _.isDefined(window.VBArray) &&
        typeof xhr.responseBody === 'unknown';
    }

    VectorTileDataService.typedArrayFromArrayBufferResponse =
      function typedArrayFromArrayBufferResponse(xhr) {
      if (xhrHasVBArray(xhr)) {
        return new VBArray(xhr.responseBody).toArray();
        // Default for well-behaved browsers.
      } else if (xhr.response && xhr.response instanceof ArrayBuffer) {
        return new Uint8Array(xhr.response);
      }

      return undefined;
    };

    /**
     * Replicates the functionality of $http, but expects an array buffer as the
     * response body
     * @param {String} url
     * @param {{headers: Object}} config
     * @returns {{promise: Promise, xhr: XMLHttpRequest}}
     */
    VectorTileDataService.getArrayBuffer = function getArrayBuffer(url, config) {
      var xhrDeferred = $q.defer();
      config = _.defaults({}, config, { header: [] });
      var xhr = new XMLHttpRequest();
      function onFail() {
        xhrDeferred.reject({
          status: parseInt(xhr.status, 10),
          headers: parseHeaders(xhr.getAllResponseHeaders()),
          config: config,
          statusText: xhr.statusText
        });
      }

      xhr.onload = function() {
        var arrayBuffer;
        var status = parseInt(xhr.status, 10);

        if (status === 200) {
          arrayBuffer = VectorTileDataService.typedArrayFromArrayBufferResponse(xhr);
          if (_.isDefined(arrayBuffer)) {
            xhrDeferred.resolve({
              data: arrayBuffer,
              status: status,
              headers: parseHeaders(xhr.getAllResponseHeaders()),
              config: config,
              statusText: xhr.statusText
            });
            return;
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

      xhr.responseType = 'arraybuffer';

      xhr.send();

      return xhrDeferred.promise;
    };

    /**
     * Curries fieldName, datasetId, and whereClause into a function that can
     * be called to perform an ajax call for a vector tile
     * @param {String} fieldName
     * @param {String} datasetId
     * @param {String} [whereClause]
     * @param {Boolean} [useOriginHost] True if should only request tiles from origin host
     * @returns {tileGetter} Curried function for fetching vector tile
     */
    VectorTileDataService.buildTileGetter = function buildTileGetter(
      fieldName,
      datasetId,
      whereClause,
      useOriginHost
    ) {
      var featuresPerTile = parseInt(ServerConfig.get('featureMapFeaturesPerTile'), 10);
      if (_.isNaN(featuresPerTile) || featuresPerTile < 0 || featuresPerTile > MAX_FEATURES_PER_TILE) {
        featuresPerTile = DEFAULT_FEATURES_PER_TILE;
      }

      /**
       * Given zoom level, x, and y values, returns an object with an XHR for the corresponding
       * vector tile, and a promise that wraps the completion of the XHR
       * @typedef tileGetter
       * @type {Function}
       * @param {Number} zoom
       * @param {Number} x
       * @param {Number} y
       * @returns {{promise: Promise, xhr: XMLHttpRequest}}
       */
      function tileGetter(zoom, x, y) {
        var url = $.baseUrl('/tiles/{0}/{1}/{2}/{3}/{4}.pbf'.format(datasetId, fieldName, zoom, x, y));

        url.searchParams.set('$limit', featuresPerTile);
        if (_.isPresent(whereClause)) {
          url.searchParams.set('$where', whereClause);
        }
        url.host = this.getHost(x, y, useOriginHost);
        return this.getArrayBuffer(
          url.href,
          {
            headers: {
              'X-Socrata-Host': ServerConfig.get('cname'),
              'X-Socrata-RequestId': RequestId.generate(),
              'X-App-Token': ServerConfig.get('dataCardsAppToken')
            }
          }
        );
      }

      return _.bind(tileGetter, VectorTileDataService);
    };

    return VectorTileDataService;
  }

  angular.
    module('dataCards.services').
    service('VectorTileDataService', VectorTileDataService);

})();
