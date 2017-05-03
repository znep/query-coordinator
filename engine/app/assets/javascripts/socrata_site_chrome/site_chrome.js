/*eslint no-unused-vars:0*/

var siteChromeTemplate;
var $siteChromeHeader;
var $siteChromeHeaderDesktopNav;
var $siteChromeHeaderMobileNav;
var $siteChromeMobileMenu;
var navLinkFullWidth;
var navbarRightWidth;
var initialBodyOverflowY;

$(document).ready(function() {
  $siteChromeHeader = $('#site-chrome-header');
  $siteChromeHeaderDesktopNav = $siteChromeHeader.find('nav.desktop');
  $siteChromeHeaderMobileNav = $siteChromeHeader.find('nav.mobile');
  $siteChromeMobileMenu = $siteChromeHeader.find('.mobile-menu');
  siteChromeTemplate = $siteChromeHeader.attr('template');
  navLinkFullWidth = $siteChromeHeaderDesktopNav.find('.site-chrome-nav-links').width();

  if (siteChromeTemplate === 'evergreen')
    navbarRightWidth = $siteChromeHeader.find('.evergreen-link-cluster').width();
  else if (siteChromeTemplate === 'rally')
    navbarRightWidth = $siteChromeHeader.find('.navbar-right').width();

  initialBodyOverflowY = $('body').css('overflow-y') || 'visible';

  addAriaExpandedAttributeToSearchBox();
  verticallyPositionSearchbar();
  checkMobileBreakpoint();

  // Show header nav. It has opacity set to 0 initially to prevent a flash of desktop styling on mobile.
  $siteChromeHeader.find('nav').css('opacity', 1);
});

$(window).resize(checkMobileBreakpoint);

function addAriaExpandedAttributeToSearchBox() {
  $('.searchbox').attr('aria-expanded', 'false');
}

function mobileMenuToggle() {
  if ($siteChromeMobileMenu.hasClass('active')) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

function openMobileMenu() {
  $siteChromeMobileMenu.addClass('active');
  $siteChromeMobileMenu.attr('aria-expanded', 'true');
  // Disable body from scrolling while menu is open
  $('body').css('overflow-y', 'hidden');
  mobileLanguageSwitcher($('.mobile-language-dropdown'));
}

function closeMobileMenu() {
  $siteChromeMobileMenu.removeClass('active');
  $siteChromeMobileMenu.attr('aria-expanded', 'false');
  $('body').css('overflow-y', initialBodyOverflowY);
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
    var $banner = $siteChromeHeader.find('.banner');
    var positionTop = $banner.height() / 2 - $searchbox.height() / 2;

    $searchbox.css('top', positionTop);
  }
}

/**
 * Check if the header should enter mobile mode based on the width of the navLinks
 * and the available width of the navbar based on the user's window size.
 */
function checkMobileBreakpoint() {
  var roomForNavLinks;
  if (siteChromeTemplate === 'evergreen') {
    var logoWidth = $siteChromeHeader.find('a.logo').width();
    var headerContentWidth = $siteChromeHeader.find('.header-content').width();
    var headerPadding = 26; // px
    roomForNavLinks = headerContentWidth - logoWidth - navbarRightWidth - headerPadding;

    if (navLinkFullWidth > roomForNavLinks) {
      showMobileHeaderNav();
    } else {
      showDesktopHeaderNav();
    }
  } else if (siteChromeTemplate === 'rally') {
    var rallyBottomWidth = $siteChromeHeader.find('.rally-bottom').width();
    roomForNavLinks = rallyBottomWidth - navbarRightWidth;

    var $rallyTop = $siteChromeHeader.find('.rally-top');
    var roomForRallyTopContent = $rallyTop.width();
    var rallyTopContentWidth =
      $rallyTop.find('a.logo').width() +
      $rallyTop.find('div.searchbox').width() +
      16; // padding

    if (navLinkFullWidth > roomForNavLinks || rallyTopContentWidth > roomForRallyTopContent) {
      showMobileHeaderNav();
    } else {
      showDesktopHeaderNav();
    }
  }

  // Undo initial styling to hide searchbox during width calculations.
  // Prevents "flashing" of non-mobile search when on mobile.
  $siteChromeHeader.find('div.searchbox.initial').removeClass('initial');
}

function showDesktopHeaderNav() {
  // Hide mobile nav
  $siteChromeHeaderMobileNav.css('display', 'none');
  $siteChromeHeaderMobileNav.attr('aria-hidden', 'true');
  $siteChromeHeader.find('.mobile-menu').attr('aria-hidden', 'true');
  // Close mobile menu if it is open
  if ($siteChromeHeader.find('.mobile-menu').hasClass('active')) {
    closeMobileMenu();
  }
  // Show desktop nav
  $siteChromeHeaderDesktopNav.css('display', 'block');
  $siteChromeHeader.find('.rally-top .searchbox').show();
  $siteChromeHeaderDesktopNav.attr('aria-hidden', 'false');
}

function showMobileHeaderNav() {
  // Hide desktop nav
  $siteChromeHeaderDesktopNav.css('display', 'none');
  $siteChromeHeaderDesktopNav.attr('aria-hidden', 'true');
  // Show mobile nav
  $siteChromeHeaderMobileNav.css('display', 'block');
  $siteChromeHeader.find('.rally-top .searchbox').hide();
  $siteChromeHeaderMobileNav.attr('aria-hidden', 'false');
  $siteChromeHeader.find('.mobile-menu').attr('aria-hidden', 'false');
}
