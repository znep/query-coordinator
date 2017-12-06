(function($) {
  if (!$) {
    console.error('jQuery appears not to be defined on this page!');
    return;
  }

  var appToken = getAppToken();

  var header = $('#site-chrome-admin-header');
  var createMenu = $('#site-chrome-create-menu');

  header.find('[aria-haspopup]').
    on('click', toggleAdminDropdown).
    on('blur', blurAdminDropdown).
    on('keypress', keypressAdminDropdown).
    on('keydown', keydownAdminDropdown).
    on('keyup', keyupAdminDropdown);

  header.find('[role="menu"] li a').
    on('blur', blurAdminDropdown).
    on('keydown', keydownAdminDropdownItem).
    on('keyup', keyupAdminDropdownItem);

  if (appToken) {
    createMenu.find('.create-story').on('click', clickCreateStory);
    createMenu.find('.create-measure').on('click', clickCreateMeasure);
  } else {
    createMenu.find('.create-story').hide();
    createMenu.find('.create-measure').hide();
  }

  // End script execution; only hoisted methods below.
  return;

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

  /**
   * Creates a story.
   */
  function clickCreateStory() {
    var metadata = {
      displayFormat: {},
      displayType: 'story',
      metadata: {
        availableDisplayTypes: ['story'],
        initialized: false,
        isStorytellerAsset: true,
        jsonQuery: {},
        renderTypeConfig: {
          visible: {
            story: true
          }
        },
        tileConfig: {}
      },
      name: generateDatedTitle($(this).data('default-title')),
      query: {}
    };

    createPublishedView(metadata).then(
      function(id) { window.location.href = '/stories/s/' + id + '/create'; },
      console.error
    );
  }

  /**
   * Creates a measure.
   */
  function clickCreateMeasure() {
    var metadata = {
      displayFormat: {},
      displayType: 'measure',
      metadata: {
        availableDisplayTypes: ['measure'],
        jsonQuery: {},
        renderTypeConfig: {
          visible: {
            measure: true
          }
        }
      },
      name: generateDatedTitle($(this).data('default-title')),
      query: {}
    };

    createPublishedView(metadata).then(
      function(id) { window.location.href = '/d/' + id + '/edit'; },
      console.error
    );
  }

  /**
   * Allocates and publishes a new asset. This helper allows us to share a
   * common workflow for stories and measures.
   *
   * NOTE: frontend/public/javascripts/screens/browse.js has a nearly-duplicated
   * implementation; the duplication was an improvement over having two totally
   * different implementations. Please try not to let the two implementations
   * drift too far apart before we're able to consolidate.
   *
   * NOTE: Promise wrapping is necessary in order to overcome the limitations of
   * jQuery 1.x AJAX capabilities. Promises are polyfilled in IE11.
   */
  function createPublishedView(metadata) {
    // You can't perform this operation without an app token and CSRF token.
    // We retrieve the CSRF token per request, which should help down the road
    // if we decide to rotate CSRF tokens more aggressively.
    if (!appToken) {
      return Promise.reject(new Error('AppToken is not accessible!'));
    }

    // Allocate a new asset.
    return new Promise(function(resolve, reject) {
      var allocationError = new Error(
        'View allocation failed; check network response for details.'
      );

      $.ajax({
        url: '/api/views.json',
        type: 'POST',
        data: JSON.stringify(metadata),
        headers: {
          'Content-type': 'application/json',
          'X-App-Token': appToken,
          'X-CSRF-Token': getCSRFToken()
        },
        success: function(response) {
          var valid = response.hasOwnProperty('id') && validate4x4(response.id);
          valid ? resolve(response.id) : reject(allocationError);
        },
        error: function() { reject(allocationError); }
      });
    }).then(function(id) {
      // If allocation was successful, publish the asset.
      return new Promise(function(resolve, reject) {
        var publicationError = new Error(
          'View publication failed; check network response for details.'
        );

        $.ajax({
          url: '/api/views/' + id + '/publication.json?accessType=WEBSITE',
          type: 'POST',
          headers: {
            'X-App-Token': appToken,
            'X-CSRF-Token': getCSRFToken()
          },
          success: function(response) {
            var valid = response.hasOwnProperty('id') && validate4x4(response.id);
            valid ? resolve(response.id) : reject(publicationError);
          },
          error: function() { reject(publicationError); }
        });
      });
    });
  }

  /**
   * Validates given string is 4x4 id
   * @param {String} testString
   */
  function validate4x4(testString) {
    return /^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(testString);
  }

  function getAppToken() {
    var siteChromeAppToken = window.socrata && window.socrata.siteChrome && window.socrata.siteChrome.appToken;
    var serverConfigAppToken = window.serverConfig && window.serverConfig.appToken;
    var blistAppToken = window.blist && window.blist.configuration && window.blist.configuration.appToken;

    return siteChromeAppToken || serverConfigAppToken || blistAppToken || null;
  }

  // This token could also be obtained via $.cookies.get('socrata-csrf-token').
  // See all-screens.js for reference.
  function getCSRFToken() {
    var serverConfigCSRFToken = window.serverConfig && window.serverConfig.csrfToken;
    var blistCSRFToken = $('meta[name="csrf-token"]').attr('content');

    return serverConfigCSRFToken || blistCSRFToken || null;
  }

  function generateDatedTitle(defaultTitle) {
    var now = new Date();
    var datePieces = [
      String(now.getMonth() + 1).padStart(2, 0),
      String(now.getDate()).padStart(2, 0),
      now.getFullYear()
    ];
    return defaultTitle + ' - ' + datePieces.join('-');
  }

}(window.$));
