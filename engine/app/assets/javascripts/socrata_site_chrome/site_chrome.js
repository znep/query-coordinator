/*eslint no-unused-vars:0*/

var initialBodyOverflowY;

$(document).ready(function() {
  initialBodyOverflowY = $('body').css('overflow-y');
  addAriaHiddenAttributeToUnusedNavVariant();
  addAriaExpandedAttributeToSearchBox();
  verticallyPositionSearchbar();

  $('.disablePreviewMode').click(function(evt) {
    evt.preventDefault();
    // Apparently this is how you delete cookies?
    if ($.cookies) {
      $.cookies.del('socrata_site_chrome_preview');
    } else {
      document.cookie = 'socrata_site_chrome_preview=deleted; expires=' + new Date(0).toUTCString();
    }
    window.location.reload();
  });

  $('#site-chrome-admin-header [aria-haspopup]').
    on('click', toggleAdminDropdown).
    on('blur', blurAdminDropdown).
    on('keydown', keydownAdminDropdown).
    on('keyup', keyupAdminDropdown);
  $('#site-chrome-admin-header [role="menu"] li a').
    on('blur', blurAdminDropdown).
    on('keydown', keydownAdminDropdownItem).
    on('keyup', keyupAdminDropdownItem);
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
 * - Toggle active class when any click
 *   occurs on the menu button.
 * - Toggle a11y aria-hidden.
 * - Focus the first menu item to assist navigation.
 */
function toggleAdminDropdown(event) {
  var $dropdown = $(event.target).closest('[aria-haspopup]');
  var $menu = $dropdown.find('[role="menu"]');

  $dropdown.toggleClass('active');

  $menu.
    // Is the menu showing?
    attr('aria-hidden', !$dropdown.hasClass('active')).
    // Focus the first element of the menu.
    find('li a').first().focus();
}

/**
 * Catch and block SPACE and DOWN on the dropdown toggle.
 */
function keydownAdminDropdown(event) {
  // 32 === SPACE, 40 === DOWN
  if (event.keyCode == 32 || event.keyCode == 40) {
    event.preventDefault();
    event.stopPropagation();
  }
}

/**
 * Toggle dropdown menu visibility on SPACE and DOWN.
 */
function keyupAdminDropdown(event) {
  // 32 === SPACE, 40 === DOWN
  if (event.keyCode === 32 || event.keyCode === 40) {
    event.preventDefault();
    event.stopPropagation();

    toggleAdminDropdown(event);
  }
}

/**
 * Catch and block UP and DOWN on the dropdown item.
 */
function keydownAdminDropdownItem(event) {
  // 40 === DOWN, 38 === UP
  if (event.keyCode === 40 || event.keyCode === 38) {
    event.preventDefault();
    event.stopPropagation();
  }
}

/**
 * - Chooses the next focusable dropdown item when DOWN
 *   is pressed. If there isn't one, the current item
 *   remains focused.
 * - Chooses the previous focusable dropdown item when
 *   UP is pressed. If there isn't one, the menu toggle
 *   is focused.
 */
function keyupAdminDropdownItem(event) {
  var $target = $(event.target);
  var keyCode = event.keyCode;

  // 40 === DOWN, 38 === UP
  if (keyCode === 40 || keyCode === 38) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (keyCode === 40) {
    $target.closest('li').next('li').find('a').focus();
  } else if (keyCode === 38) {
    var $previousItem = $target.closest('li').prev('li').find('a');

    if ($previousItem.length) {
      $previousItem.focus();
    } else {
      $target.closest('[aria-haspopup]').focus();
    }
  }
}

/**
 * Wait and watch where focus goes to, if the focus
 * ends up in the same dropdown, don't do anything.
 * If it ends up anywhere else, close the dropdown right up.
 */
function blurAdminDropdown(event) {
  var target = event.target;

  setTimeout(function() {
    var $menu = $(document.activeElement).closest('[aria-haspopup]');
    var $targetMenu = $(target).closest('[aria-haspopup]');

    if ($menu.length === 0 || $menu[0] !== $targetMenu[0]) {
      $targetMenu.removeClass('active');
      $targetMenu.find('[role="menu"]').
        attr('aria-hidden', 'true');
    }
  }, 1);
}

/**
 * Browsers like IE11 don't understand nested calc commands, which are used to position the searchbar
 * due to vertically aligning it with the dynamically sized logo.
 * Instead, we need to position it with javascript.
 */
function verticallyPositionSearchbar() {
  if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
    var $searchbox = $('header#site-chrome-header .collapsible-search .searchbox');
    var $banner = $('#site-chrome-header .banner');
    var positionTop = $banner.height() / 2 - $searchbox.height() / 2;

    $searchbox.css('top', positionTop);
  }
}
