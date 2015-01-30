(function() {
  'use strict';

  var CONFIGURATION_PATH_TEMPLATE = '/api/configurations.json?type={0}&defaultOnly=true&merge=true';
  var THEME_CONFIGURATION_KEY = 'theme_v3';

  /**
   * Configurations service wrapper
   *
   * @constructor
   */
  function ConfigurationsService(http) {

    function getConfigurationObservable(key) {
      return Rx.Observable.
        fromPromise(http.get(CONFIGURATION_PATH_TEMPLATE.format(key))).
        filter(function(response) { return response.status === 200 }).
        map(function(response) {
          return _.getPathOrElse(response, 'data.0.properties', []);
        }).
        catch(Rx.Observable.return([]));
    }

    return {
      /**
       * Returns a stream of theme configuration data, which is formatted as
       * an array of objects with form {name: 'xxx', value: 'yyy'}
       * @returns Observable
       */
      getThemeConfigurationsObservable: _.once(_.bind(getConfigurationObservable, this, THEME_CONFIGURATION_KEY)),
      /**
       * Convenience method for getting a value from a configuration data array
       * given the key for the field
       * @param configuration Array
       * @param key String
       * @returns {String}
       */
      getConfigurationValue: function(configuration, key) {
        return _(configuration).chain().findWhere({ name: key }).result('value').value();
      }
    }
  }

  angular.
    module('socrataCommon.services').
    service('ConfigurationsService', ConfigurationsService);

})();
