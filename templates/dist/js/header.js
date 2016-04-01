// Mobile menu flyout
$(document).ready(function() {
  $menu = $('.mobile-menu');
  $menuToggle = $('.menu-toggle');

  $menuToggle.click(function() {
    $menu.toggleClass('active');
  });
});
