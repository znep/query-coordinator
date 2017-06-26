(function($) {
  if (!$) {
    return;
  }

  $(document).ready(function() {
    $('#site-chrome-admin-header [aria-haspopup]').
      on('click', toggleAdminDropdown).
      on('blur', blurAdminDropdown).
      on('keypress', keypressAdminDropdown).
      on('keydown', keydownAdminDropdown).
      on('keyup', keyupAdminDropdown);
    $('#site-chrome-admin-header [role="menu"] li a').
      on('blur', blurAdminDropdown).
      on('keydown', keydownAdminDropdownItem).
      on('keyup', keyupAdminDropdownItem);
  });
})(window.$);

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
 * Catch keypress and dispatch as click for accessibility purposes
 */
function keypressAdminDropdown(event) {
  // 13 === ENTER, 32 === SPACE
  if ([13, 32].includes(event.which)) {
    var clickEvent = new Event('click', { 'bubbles': true });
    event.target.dispatchEvent(clickEvent);
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
