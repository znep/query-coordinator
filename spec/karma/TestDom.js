(function() {
  'use strict';

  function createTestDom() {
    $('#test-dom').remove();
    $('body').append('<div id="test-dom">');
    window.testDom = $('#test-dom');
  }

  // Create a fresh testDom before each test.
  beforeEach(createTestDom);

})();
