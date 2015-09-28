(function() {
  'use strict';
  // Extracted from inflection-js (https://code.google.com/p/inflection-js/),
  // a port of the functionality from Ruby on Rails' Active Support Inflection classes into Javascript.
  // MIT Licensed

  var pluralRules = [
    [new RegExp('(m)an$', 'gi'), '$1en'],
    [new RegExp('(pe)rson$', 'gi'), '$1ople'],
    [new RegExp('(child)$', 'gi'), '$1ren'],
    [new RegExp('^(ox)$', 'gi'), '$1en'],
    [new RegExp('(ax|test)is$', 'gi'), '$1es'],
    [new RegExp('(octop|vir)us$', 'gi'), '$1i'],
    [new RegExp('(alias|status)$', 'gi'), '$1es'],
    [new RegExp('(bu)s$', 'gi'), '$1ses'],
    [new RegExp('(buffal|tomat|potat)o$', 'gi'), '$1oes'],
    [new RegExp('([ti])um$', 'gi'), '$1a'],
    [new RegExp('sis$', 'gi'), 'ses'],
    [new RegExp('(?:([^f])fe|([lr])f)$', 'gi'), '$1$2ves'],
    [new RegExp('(hive)$', 'gi'), '$1s'],
    [new RegExp('([^aeiouy]|qu)y$', 'gi'), '$1ies'],
    [new RegExp('(x|ch|ss|sh)$', 'gi'), '$1es'],
    [new RegExp('(matr|vert|ind)ix|ex$', 'gi'), '$1ices'],
    [new RegExp('([m|l])ouse$', 'gi'), '$1ice'],
    [new RegExp('(quiz)$', 'gi'), '$1zes'],
    [new RegExp('s$', 'gi'), 's'],
    [new RegExp('$', 'gi'), 's']
  ];

  var uncountableWords = [
    'equipment', 'information', 'rice', 'money', 'species', 'series',
    'fish', 'sheep', 'moose', 'deer', 'news',
    'sugar', 'butter', 'water',
    'furniture', 'luggage',
    'advice', 'information', 'news', 'info',
    'music', 'art', 'love', 'happiness',
    'electricity', 'gas', 'power'
  ];

  function applyRules(str, rules, skip) {
    str = str.trim();
    var lastWord = _.last(str.split(' '));
    var ignore = (skip.indexOf(lastWord.toLowerCase()) > -1);
    if (!ignore) {
      for (var x = 0; x < rules.length; x++) {
        if (str.match(rules[x][0])) {
          str = str.replace(rules[x][0], rules[x][1]);
          break;
        }
      }
    }

    return str;
  }

  function pluralize(str, count) {
    window.socrata.utils.assertIsOneOfTypes(count, 'number', 'undefined');

    if (count === 1) {
      return str;
    }

    return applyRules(str, pluralRules, uncountableWords);
  }

  function PluralizeService() {
    return {
      pluralize: pluralize
    };
  }

  angular.
    module('socrataCommon.services').
      factory('PluralizeService', PluralizeService);
})();
