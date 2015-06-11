(function() {
  'use strict';

  function I18n($log) {

    // TODO clean this up using _.mapKeys when we upgrade lodash
    function camelCaseKeys(obj) {
      return _.transform(obj, function(result, value, key) {
        result[_.camelCase(key)] = !_.isObject(value) ? value : camelCaseKeys(value);
      });
    }

    var i18n = camelCaseKeys(window.translations);

    i18n.t = function(key) {
      if (_.isString(key)) {
        var template = _.get(i18n, key, undefined);

        if (_.isUndefined(template)) {
          $log.error('Tried to internationalize unknown key "' + key + '"');
        }

        // This logic is needed to prevent an IE9 bug where strings would be
        // wrapped with quotation marks.
        return (arguments.length <= 1) ? template :
          template.format.apply(template, Array.prototype.slice.call(arguments, 1));
      }
      else {
        return '';
      }
    };

    return i18n;
  }

  angular.
    module('dataCards.services').
      service('I18n', I18n);

})();
