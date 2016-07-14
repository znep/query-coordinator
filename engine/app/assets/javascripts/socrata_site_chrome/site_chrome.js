// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.

setTimeout(function() {
  $(document).ready(function() {
    mobileMenuFlyout();
  });
}, 1000); // TODO HACK Don't do this.

function mobileMenuFlyout() {
  var $menu = $('#site-chrome-header .mobile-menu');
  var $menuToggle = $('#site-chrome-header .menu-toggle');
  var initialBodyOverflowY = $('body').css('overflow-y');

  $menuToggle.click(function() {
    $menu.toggleClass('active');
    if ($menu.hasClass('active')) {
      // Disable body from scrolling while menu is open
      $('body').css('overflow-y', 'hidden');
    } else {
      $('body').css('overflow-y', initialBodyOverflowY);
    }
  });
}
