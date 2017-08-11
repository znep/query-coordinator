const utils = require('common/js_utils');
const DataProvider = require('./DataProvider');
const _ = require('lodash');

function GeospaceDataProvider(config, useCache = false) {

  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  utils.assertIsOneOfTypes(config.domain, 'string');
  utils.assertIsOneOfTypes(config.datasetUid, 'string');

  if (useCache) {
    const cached = this.cachedInstance("GeospaceDataProvider");
    if (cached) {
      return cached;
    }
  }

  /**
   * Public methods
   */

  const featureExtentPromiseCache = {};
  this.getFeatureExtent = function(columnName) {

    const url = 'https://{0}/resource/{1}.json?$select=extent({2})&$$read_from_nbe=true&$$version=2.1'.format(
      this.getConfigurationProperty('domain'),
      this.getConfigurationProperty('datasetUid'),
      columnName
    );
    const headers = {
      Accept: 'application/json'
    };

    const cacheKey = url;

    const cachedPromise = featureExtentPromiseCache[cacheKey];
    if (cachedPromise) {
      return cachedPromise;
    }

    const loadFeatureExtentPromise = new Promise(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();

        function onFail() {
          let error;

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
          const status = parseInt(xhr.status, 10);

          if (status === 200) {
            try {
              const responseTextWithoutNewlines = xhr.
                responseText.
                replace(/\n/g, '');
              const coordinates = _.get(
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
      }
    );

    featureExtentPromiseCache[cacheKey] = loadFeatureExtentPromise;

    return loadFeatureExtentPromise;

  };

  const shapefilePromiseCache = {};
  this.getShapefile = function(extent) {

    let url = 'https://{0}/resource/{1}.geojson'.format(
      this.getConfigurationProperty('domain'),
      this.getConfigurationProperty('datasetUid')
    );
    const headers = {
      Accept: 'application/json'
    };
    const extentQuery = extent ?
      "?$select=*&$where=intersects(the_geom, 'MULTIPOLYGON((({0})))')&$limit=5000" :
      '?$select=*&$limit=5000';
    const extentValidationErrorMessage = 'Argument `extent` must be an object ' +
      'with two keys: `southwest` and `northeast`; the value assigned to ' +
      'each key must be an array of two numbers in the following format: `[' +
      'latitude, longitude]`.';

    // Do not use a looser test for falsiness because if an invalid extent is
    // provided in any form we want to kick an error up to help with debugging.
    if (!_.isUndefined(extent)) {
      if (extentIsValid(extent)) {

        url += extentQuery.format(
          mapExtentToMultipolygon(extent)
        );

      } else {

        return (
          new Promise(function(resolve, reject) {
            return reject({
              status: -1,
              message: extentValidationErrorMessage,
              soqlError: null
            });
          })
        );
      }
    }

    const cacheKey = url;

    const cachedPromise = shapefilePromiseCache[cacheKey];
    if (cachedPromise) {
      return cachedPromise;
    }

    const loadShapefilePromise = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      function onFail() {
        let error;

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
        const status = parseInt(xhr.status, 10);

        if (status === 200) {
          try {
            const responseTextWithoutNewlines = xhr.responseText.replace(/\n/g, '');
            resolve(JSON.parse(responseTextWithoutNewlines));
          } catch (e) {
            console.log(e);
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

    shapefilePromiseCache[cacheKey] = loadShapefilePromise;

    return loadShapefilePromise;

  };

  function extentIsValid(extent) {

    return (
      // Validate that it is an object with northeast and
      // southwest properties.
      _.isObject(extent) &&
      // Next validate the northeast property.
      _.isArray(extent.northeast) &&
      extent.northeast.length === 2 &&
      _.every(extent.northeast, _.isNumber) &&
      // Then validate the southwest property.
      _.isArray(extent.southwest) &&
      extent.southwest.length === 2 &&
      _.every(extent.southwest, _.isNumber)
    );
  }

  /**
   * Multipolygon queries expect a polygon in clockwise order, starting from
   * the bottom left. Polygons are closed, meaning that the start and end
   * points must be identical.
   *
   * Example:
   *
   * 2----3
   * |    |
   * 1,5--4
   *
   * Where each pair is: longitude latitude
   */
  function mapExtentToMultipolygon(extent) {

    return '{0} {1},{2} {3},{4} {5},{6} {7}, {8} {9}'.format(
      extent.southwest[1],
      extent.southwest[0],
      extent.southwest[1],
      extent.northeast[0],
      extent.northeast[1],
      extent.northeast[0],
      extent.northeast[1],
      extent.southwest[0],
      extent.southwest[1],
      extent.southwest[0]
    );
  }
}

module.exports = GeospaceDataProvider;
