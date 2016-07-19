/*eslint no-unused-vars:0*/

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

function toggleCollapsibleSearch(self) {
  var $searchbox = $(self).siblings('.searchbox');
  $searchbox.toggleClass('expanded');
  $searchbox.find('input').focus();

  // Close searchbox on click outside of box
  $(document).mouseup(function(e) {
    if (!$searchbox.is(e.target) && $searchbox.has(e.target).length === 0) {
      $searchbox.removeClass('expanded');
    }
  });

  // Close searchbox on ESCAPE key
  $(document).keyup(function(e) {
    if (e.keyCode === 27) {
      $searchbox.removeClass('expanded');
    }
  });
}

// Button appears only if text has been entered.
function toggleSearchButton(self) {
  var $searchButton = $(self).siblings('.search-button');
  if (self.value !== '') {
    $searchButton.fadeIn(50);
  } else {
    $searchButton.fadeOut(50);
  }
}
