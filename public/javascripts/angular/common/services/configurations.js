(function() {
  'use strict';

  var THEME_CONFIGURATION_KEY = 'theme_v3';
  var GET_CONFIGURATION_TIMER_MS = 5000;

  /**
   * Configurations service wrapper
   *
   * @constructor
   */
  function ConfigurationsService(http) {

    function getConfigurationUrl(type) {
      var url = $.baseUrl('/api/configurations.json');
      url.searchParams.set('defaultOnly', true);
      url.searchParams.set('merge', true);
      url.searchParams.set('type', type);
      return url;
    }

    var self = this;

    function getConfigurationObservable(key) {
      var promise = http.get(getConfigurationUrl(key).href, {requester: self});
      var successfulPromiseObservable = Rx.Observable.fromPromise(promise).
        filter(function(response) { return response.status === 200; });
      return Rx.Observable.merge(
        successfulPromiseObservable.
          map(function(response) {
            return _.getPathOrElse(response, 'data.0.properties', []);
          }).
          catchException(Rx.Observable.returnValue([])),
        Rx.Observable.timer(GET_CONFIGURATION_TIMER_MS).
          takeUntil(successfulPromiseObservable).
          map(_.constant([]))
      );
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
    };
  }

  angular.
    module('socrataCommon.services').
    service('ConfigurationsService', ConfigurationsService);

})();
