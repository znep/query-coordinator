// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.

$(document).ready(function() {
  mobileMenuFlyout();
});

function mobileMenuFlyout() {
  var $menu = $('#chrome-header .mobile-menu');
  var $menuToggle = $('#chrome-header .menu-toggle');
  var initialBodyOverflow = $('body').css('overflow');

  $menuToggle.click(function() {
    $menu.toggleClass('active');
    if ($menu.hasClass('active')) {
      // Disable body from scrolling while menu is open
      $('body').css('overflow', 'hidden');
    } else {
      $('body').css('overflow', initialBodyOverflow);
    }
  });
}
