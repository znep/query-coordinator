/*eslint no-unused-vars:0*/

var initialBodyOverflowY;

$(document).ready(function() {
  initialBodyOverflowY = $('body').css('overflow-y');
  addAriaHiddenAttributeToUnusedNavVariant();
  addAriaExpandedAttributeToSearchBox();
  verticallyPositionSearchbar();
});

function addAriaHiddenAttributeToUnusedNavVariant() {
  var $desktopNav = $('#site-chrome-header nav.desktop');
  var $mobileNav = $('#site-chrome-header nav.mobile');

  if ($desktopNav.css('display') === 'block') {
    $mobileNav.attr('aria-hidden', 'true');
    $('#site-chrome-header .mobile-menu').attr('aria-hidden', 'true');
  } else {
    $desktopNav.attr('aria-hidden', 'true');
  }
}

function addAriaExpandedAttributeToSearchBox() {
  $('.searchbox').attr('aria-expanded', 'false');
}

function mobileMenuToggle() {
  var $menu = $('#site-chrome-header .mobile-menu');
  $menu.toggleClass('active');
  if ($menu.hasClass('active')) {
    $menu.attr('aria-expanded', 'true');
    // Disable body from scrolling while menu is open
    $('body').css('overflow-y', 'hidden');
    mobileLanguageSwitcher($('.mobile-language-dropdown'));
  } else {
    $menu.attr('aria-expanded', 'false');
    $('body').css('overflow-y', initialBodyOverflowY || 'visible');
  }
}

function mobileLanguageSwitcher($div) {
  $div.children('.mobile-language-dropdown-title').click(function() {
    $div.children('.mobile-language-dropdown-options').slideToggle('fast');
    // Scroll down as the dropdown options div appears
    $('.mobile-menu').animate({
      scrollTop: $('.mobile-language-dropdown-options').offset().top
    }, 'fast');
  });
}

function toggleCollapsibleSearch(self) {
  var $searchbox = $(self).siblings('.searchbox');
  $searchbox.toggleClass('expanded');
  $searchbox.find('input').focus();

  if ($searchbox.hasClass('expanded')) {
    $searchbox.attr('aria-expanded', 'true');
  }

  // Close searchbox on click outside of box
  $(document).mouseup(function(e) {
    if (!$searchbox.is(e.target) && $searchbox.has(e.target).length === 0) {
      $searchbox.removeClass('expanded');
      $searchbox.attr('aria-expanded', 'false');
    }
  });

  // Close searchbox on ESCAPE key
  $(document).keyup(function(e) {
    if (e.keyCode === 27) {
      $searchbox.removeClass('expanded');
      $searchbox.attr('aria-expanded', 'false');
    }
  });
}

// Button appears only if text has been entered.
function toggleSearchButton(self) {
  var $searchButton = $(self).closest('form').find('.search-button');
  if (self.value !== '') {
    $searchButton.fadeIn(50);
  } else {
    $searchButton.fadeOut(50);
  }
}

/**
 * Browsers like IE11 don't understand nested calc commands, which are used to position the searchbar
 * due to vertically aligning it with the dynamically sized logo.
 * Instead, we need to position it with javascript.
 */
function verticallyPositionSearchbar() {
  var isMSIE = navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0;
  var isSafari = navigator.userAgent.indexOf('Safari') !== -1;
  if (isMSIE || isSafari) {
    var $searchbox = $('header#site-chrome-header .collapsible-search .searchbox');
    var $banner = $('#site-chrome-header .banner');
    var positionTop = $banner.height() / 2 - $searchbox.height() / 2;

    $searchbox.css('top', positionTop);
  }
}
