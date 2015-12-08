//= require jquery
//= require jquery_ujs
//= require_self

(function() {
  'use strict';

  $(function() {
    function flashCallback() {
      $('.alert').fadeOut();
    }
    setTimeout(flashCallback, 3000);
  });
})();
