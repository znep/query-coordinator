(function(window) {

  'use strict';

  if (!_.has(window, 'socrata.visualizations.DataProvider')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.DataProvider.js',
          'socrata.visualizations.SoqlDataProvider.js'
        )
    );
  }

  function SoqlDataProvider(config) {

    _.extend(this, new window.socrata.visualizations.DataProvider(config));

    // TODO: Validate config options.
    var _uid = config.fourByFour;
    var _successCallback = config.success;
    var _errorCallback = config.error;

    /**
     * Public methods
     */

    this.query = function(queryString, nameAlias, valueAlias) {

      // Call _soqlQuery with `this` context in order to be able to call
      // `.getconfig()` on the parent class.
      _soqlQuery.call(this, queryString, nameAlias, valueAlias);
    };

    /**
     * Private methods
     */

    function _soqlQuery(queryString, nameAlias, valueAlias) {

      function _onRequestError(response) {
        _errorCallback({
          code: response.status,
          message: response.statusText,
          soqlError: JSON.parse(response.responseText)
        });
      }

      function _onRequestSuccess(data) {
        _successCallback(_mapDataToTable(data, nameAlias, valueAlias));
      }

      $.ajax(
        _buildUrl(queryString),
        {
          headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
          },
          error: _onRequestError,
          success: _onRequestSuccess,
          timeout: this.getConfig('timeout'),
          type: 'GET'
        }
      );
    }

    function _buildUrl(queryString) {

      return '/api/id/{0}.json?$query={1}'.format(
        encodeURIComponent(_uid),
        encodeURIComponent(queryString)
      );
    }

    function _mapDataToTable(data, nameAlias, valueField) {

      return {
        columns: [nameAlias, valueAlias],
        rows: data.map(function(datum) {

          return [
            datum[nameAlias],
            datum[valueAlias]
          ];
        })
      };
    }
  }

  window.socrata.visualizations.SoqlDataProvider = SoqlDataProvider;
})(window);
