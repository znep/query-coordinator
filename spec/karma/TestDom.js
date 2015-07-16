(function() {
  'use strict';
  function getRoot() {
    if ($('#test-dom').length === 0) {
      $('body').append('<div id="test-dom">');
    }
    return $('#test-dom');
  }

  window.testDom = {
    root: function(nodes) {
      return getRoot();
    },
    clear: function() {
      getRoot().remove();
    }
  };
})();

// Clear the testDom after each test.
afterEach(window.testDom.clear);
