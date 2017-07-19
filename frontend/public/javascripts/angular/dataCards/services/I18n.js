const _ = require('lodash');
const moment = require('moment-timezone');

module.exports = function I18n($log, ServerConfig, $window) {
  const localeInfo = ServerConfig.get('locales');
  moment.locale(_.get(localeInfo, 'currentLocale'));

  // TODO clean this up using _.mapKeys when we upgrade lodash
  function camelCaseKeys(obj) {
    return _.transform(obj, function(result, value, key) {
      result[_.camelCase(key)] = !_.isObject(value) ? value : camelCaseKeys(value);
    });
  }

  var i18n = camelCaseKeys($window.translations);

  // Retrieve a translation key
  i18n.t = function(key) {

    if (_.isString(key)) {

      var template = _.get(i18n, key, undefined);

      if (_.isUndefined(template)) {
        $log.error('Tried to internationalize unknown key "' + key + '"');
      } else {

        // This logic is needed to prevent an IE9 bug where strings would be
        // wrapped with quotation marks.
        return (arguments.length <= 1) ? template :
          template.format.apply(template, Array.prototype.slice.call(arguments, 1));
      }
    }

    return '';
  };

  // Turns a url into a localized version of the url:
  // I18n.a('/path/to/page') -> '/ru/path/to/page'
  i18n.a = function(href) {
    var localePart = '';
    if (localeInfo.currentLocale !== localeInfo.defaultLocale) {
      localePart = '/' + localeInfo.currentLocale;
    }

    if (!_.startsWith(href, '/')) {
      href = '/' + href;
    }

    return localePart + href;
  };

  return i18n;
};
