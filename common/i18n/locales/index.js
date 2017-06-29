import _ from 'lodash';

// Requires all locale strings from /common/locales and exports
// an Object where the top level keys are the locales
// { ar: {}, ca: {}, en: {} ... }

var reqLocales = require.context('.', false, /\.yml$/);

var allLocales = {};

reqLocales.keys().forEach(function(locale){
  _.extend(allLocales, reqLocales(locale));
});

export default allLocales;
