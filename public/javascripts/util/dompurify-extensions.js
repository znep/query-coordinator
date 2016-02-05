(function() {
  'use strict';

  // EN-1266: Since the text we purify can come from untrusted users (view descriptions),
  // we need to protect ourselves against window.opener attacks. Adding noreferrer fixes
  // the issue for all modern browsers except IE (edge is fine).
  DOMPurify.addHook(
    'afterSanitizeAttributes',
    function(currentNode) {
      if (currentNode instanceof HTMLAnchorElement) {
        currentNode.rel = _.union(
          _.words(currentNode.rel),
          [ 'noreferrer' ]
        ).join(' ');
      }
    }
  );

})();


