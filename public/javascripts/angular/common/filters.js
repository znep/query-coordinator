(function() {
  'use strict';

  angular.module('socrataCommon.filters', []).

  // Convert all single newlines into double newlines.
  // Useful to coerce all newlines in a markdown to
  // paragraph breaks.
  filter('singleNewlinesToDoubleNewlines', function() {
    return function(input) {
      // Conditional laziness is good, so I lifted this solution:
      // http://stackoverflow.com/questions/18011260/regex-to-match-single-new-line-regex-to-match-double-new-line
      if (!_.isString(input)) return undefined;
      else return input.replace(/(^|[^\n])\n(?!\n)/g, "$1\n\n");
    };
  }).

  // Convert all url-looking things in the input to actual links (with rel="nofollow").
  filter('linkifyUrls', function() {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
    return function(input) {
      if (!_.isString(input)) return undefined;
      else return input.replace(urlPattern, '<a href="$&" rel="nofollow">$&</a>');
    };
  }).

  // Escape all HTML entities in the input.
  filter('escapeHtml', function() {
    // Lifted from Mustache's escaper, with slight changes
    // (Don't cast to String, as we don't want undefined input to
    // return the string 'undefined').
    // https://github.com/janl/mustache.js/blob/master/mustache.js
    var entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': '&quot;',
      "'": '&#39;'
      // "/": '&#x2F;' SOCRATA: Removing this as it's making links very difficult to autodetect and linkify.
    };

    return function escapeHtml(input) {
      if (!_.isString(input)) return undefined;
      // SOCRATA: Removed / from here too.
      return input.replace(/[&<>"']/g, function (s) {
        return entityMap[s];
      });
    };
  });

})();
