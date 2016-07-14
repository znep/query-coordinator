var initialBodyOverflowY;

$(document).ready(function() {
  initialBodyOverflowY = $('body').css('overflow-y');
});

function mobileMenuToggle() {
  var $menu = $('#site-chrome-header .mobile-menu');
  $menu.toggleClass('active');
  if ($menu.hasClass('active')) {
    // Disable body from scrolling while menu is open
    $('body').css('overflow-y', 'hidden');
  } else {
    $('body').css('overflow-y', initialBodyOverflowY || 'visible');
  }
}
