//= require jquery
//= require jquery_ujs
//= require_self

$(function() {
  function flashCallback() {
    $('.alert').fadeOut();
  }
  setTimeout(flashCallback, 3000);
});
