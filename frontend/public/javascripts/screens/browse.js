$(function() {
  var $browse = $('.browseSection');
  var isListingViewType = $browse.is('[data-view-type="listing"]');

  var $listingDescriptions = $('.browse-listing-description');

  function updateDescriptionControls() {
    $listingDescriptions.
    each(function() {
      var $this = $(this);
      $this.find('.browse-listing-description-controls').
      toggleClass('hidden', parseFloat($this.css('max-height')) > $this.height());
    });
  }
  updateDescriptionControls();

  $listingDescriptions.
  on('click', '[data-expand-action]', function(event) {
    event.preventDefault();
    $(event.delegateTarget).toggleClass('is-expanded');
  });

  $(window).on('resize', _.throttle(updateDescriptionControls, 100));

  // alias this method so external scripts can get at it
  var getDS = blist.browse.getDS = function($item, browseType) {
    var id;
    switch (browseType) {
      case 'listing':
        id = $item.closest('.browse-list-item').attr('data-viewId');
        break;
      case 'table':
      case 'rich':
      default:
        var rowElement = $item.closest('tr');
        if (rowElement.attr('data-viewId')) {
          id = rowElement.attr('data-viewId');
        } else if (rowElement.attr('data-view-id')) {
          id = rowElement.attr('data-view-id');
        }
        break;
    }
    if (!(blist.browse.datasets[id] instanceof Dataset)) {
      blist.browse.datasets[id] = createDatasetFromView(blist.browse.datasets[id]);
    }
    return blist.browse.datasets[id];
  };

  var opts = {};
  if (!$.isBlank(window.location.search)) {
    _.each(window.location.search.slice(1).split('&'), function(p) {
      var s = p.split('=');

      s[0] = unescape(s[0]);

      if (/\[\]$/.test(s[0])) {
        if ($.isBlank(opts[s[0]])) {
          opts[s[0]] = [];
        }

        opts[s[0]].push(s[1]);
      } else {
        opts[s[0]] = s[1];
      }
    });
  }

  var doBrowse = function(newOpts) {
    // Reset page
    delete newOpts.page;
    // set utf8
    newOpts.utf8 = '%E2%9C%93';
    // Pull real URL from JS
    window.location = blist.browse.baseURL + '?' +
      _.map(newOpts, function(v, k) {
        if (_.isArray(v)) {
          return _.map(v, function(subvalue) {
            return k + '=' + subvalue;
          }).join('&');
        }

        return k + '=' + v;
      }).join('&');
  };

  $browse.find('select').uniform();
  $browse.find('select.hide').each(function() {
    var $t = $(this);
    $t.removeClass('hide');
    $t.closest('.uniform').addClass('hide');
  });

  var $sortType = $browse.find('select.sortType');
  var $sortPeriod = $browse.find('select.sortPeriod');
  var showHideSortPeriod = function() {
    _.defer(function() {
      $sortPeriod.closest('.uniform').toggleClass('hide', !$sortType.find('option:selected').hasClass('timePeriod'));
    });
  };
  $sortType.change(showHideSortPeriod).
  keypress(showHideSortPeriod).click(showHideSortPeriod);

  var doSort = function() {
    _.defer(function() {
      var newOpts = $.extend({}, opts);
      newOpts.sortBy = $sortType.val();
      if ($sortPeriod.is(':visible')) {
        newOpts.sortPeriod = $sortPeriod.val();
      } else {
        delete newOpts.sortPeriod;
      }
      doBrowse(newOpts);
    });
  };
  $sortType.add($sortPeriod).change(doSort);

  var doExpansion = function($row) {
    var $content = $row.find('.nameDesc .extraInfo .infoContent:empty');
    if ($content.length < 1) {
      return;
    }

    var ds = getDS($row);
    $content.append($.renderTemplate('expandedInfo', ds, {
      '.permissions.button': function(v) {
        return $.t('controls.browse.actions.permissions.change_button.' + (v.context.isPublic() ? 'public' : 'private') + '_html');
      },
      '.permissions.button@class+': function(v) {
        var publicGrant = _.detect(v.context.grants || [], function(grant) {
          return _.include(grant.flags || [], 'public');
        });
        // EN-5496 - Published stories are 404ing
        //
        // Our hypothesis for why 'published' stories are 404ing is that
        // users are actually clicking the 'Make Public' button on catalog
        // assets expecting it to trigger a Stories publishing cycle. This
        // is not actually the case, but it does manage to get the view
        // metadata in Core Server into a state where we think there should
        // be a published story asset (it is a public view) when there is
        // no corresponding published story asset (we never created a row
        // in the `PublishedStories` table, an action that is handled by
        // Stories' own publishing endpoint (which sets the view to public
        // as a second step contingent on the 'PublishedStories' row being
        // created).
        //
        // Our proposed solution is to adjust the Core Server API by which
        // the public/private status of a view is toggled such that it will
        // fail if a user attempts to trigger a private -> public
        // transition on a Core Server view and there does not exist a
        // corresponding row in the `PublishedStories` table; while that
        // work is in progress we will be disabling the ability for users
        // to toggle the private/public state of a Core Server view from
        // 'browse' experiences by hiding the button that does this if
        // the asset in question is a Story.
        var viewType = _.get(v, 'context.viewType', false);
        var displayType = _.get(v, 'context.displayType', false);
        var isStory = (
          (viewType === 'story' || viewType === 'href') &&
          displayType === 'story'
        );

        if (isStory) {
          return 'hide';
        }

        return v.context.hasRight(blist.rights.view.UPDATE_VIEW) && !v.context.isFederated() &&
          (!publicGrant || !publicGrant.inherited) ? '' : 'hide';
      },
      '.delete.button@class+': function(v) {
        var isStory = v.context.displayType === 'story';
        var canDeleteStories = blist.currentUser && blist.currentUser.hasRight(blist.rights.user.DELETE_STORY);

        if (isStory && canDeleteStories) {
          return '';
        } else if (isStory) {
          return 'hide';
        } else {
          return v.context.hasRight(blist.rights.view.DELETE_VIEW) &&
            !v.context.isFederated() ? '' : 'hide';
        }
      },
      '.comments .value': 'numberOfComments'
    }));

    blist.datasetControls.hookUpShareMenu(
      ds,
      $content.find('.share.menu'), {
        menuButtonContents: $.tag([{
          tagName: 'span',
          'class': 'shareIcon'
        }, {
          tagName: 'span',
          'class': 'shareText',
          contents: $.t('controls.browse.actions.share_button')
        }], true),
        onOpen: function() {
          $.analytics && $.analytics.trackEvent('browse ' + window.location.pathname, 'share menu opened', ds.id);
        },
        onClose: function($menu) {
          if (($.browser.msie) && ($.browser.majorVersion < 8)) {
            $menu.closest('.extraInfo').css('z-index', 0);
          }
        },
        parentContainer: $row.closest('.results')
      },
      // ONCALL-3032: Disable unauthenticated share-by-email functionality.
      // Because the SDP share button is created at runtime, we have chosen
      // to disable the share-by-email functionality in this context altogether
      // rather than attempting to guarantee that we always have the current user
      // and other related data when this code executes.
      // The fourth argument to `blist.datasetControls.hookUpShareMenu()` is
      // `hideEmail`, so we just set it to true in each invocation of the function.
      true
    );

    $content.find('.datasetAverageRating').stars({
      value: ds.averageRating
    });

    $content.find('.button.permissions:not(.hide)').click(function(e) {
      e.preventDefault();
      var $t = $(this);
      var isPublic = ds.isPublic();
      if (isPublic) {
        ds.makePrivate();
      } else {
        ds.makePublic();
      }
      $t.text($.t('controls.browse.actions.permissions.change_button.' + (!isPublic ? 'public' : 'private') + '_html'));
    });

    $content.find('.button.delete:not(.hide)').click(function(e) {
      e.preventDefault();
      var $t = $(this);
      if (confirm($.t('controls.browse.actions.delete.confirm', {
          dataset: ds.name
        }))) {
        ds.remove(function() {
          $t.closest('tr.item').remove();
        });
      }
    });

    var aboutUrl = (ds.type === 'story') ?
      ds.domainUrl + '/d/' + ds.id + '/about' :
      ds.fullUrl + ((ds.type == 'blob' || ds.type == 'href') ? '' : '/about');

    $content.find('.button.about:not(.hide)').
    attr('href', aboutUrl).
    attr('rel', ds.isFederated() ? 'external' : '');
  };

  function controlDeleteButton(e, ds) {
    e.preventDefault();
    if (confirm($.t('controls.browse.actions.delete.confirm', {
        dataset: ds.name
      }))) {
      ds.remove(function() {
        $(e.target).closest('.browse-list-item').remove();
      });
    }
  }

  function controlPermissionsButton(e, ds) {
    e.preventDefault();
    var isPublic = ds.isPublic();
    if (isPublic) {
      ds.makePrivate();
    } else {
      ds.makePublic();
    }
    e.target.textContent = $.t('controls.browse.actions.permissions.change_button.' + (!isPublic ? 'public' : 'private') + '_html');
  }

  // Hook up expansion for list view
  $browse.find('table tbody tr').expander({
    animate: false,
    contentSelector: '.nameDesc .expandBlock',
    expandSelector: '.index .expander, .nameDesc .extraInfo .close',
    expanderCollapsedClass: 'collapsed',
    expanderExpandedClass: 'expanded',
    forceExpander: true,
    preExpandCallback: doExpansion
  });

  // Hook up expansion for rich view
  $browse.find('table tbody tr').expander({
    contentSelector: '.richSection .description',
    expandSelector: '.richSection .expander',
    expanderCollapsedClass: 'collapsed',
    expanderExpandedClass: 'expanded'
  });

  // Hook up settings menu for listing view
  $browse.find('.settings-icon').each(function(index, settingsIcon) {

    // Find necessary component elements
    var parentMediaItem = $(settingsIcon).closest('.media-item');
    var $settingsMenu = parentMediaItem.siblings('.settings.menu');
    var ds = getDS($(settingsIcon), 'listing');
    // TODO:
    //   - Handle permissions
    //   - Add proper tool tips/titles
    //   - Add styling
    //   - refactor of controlPermissionsButton and controlDeleteButton and existing code
    //   - Figure out how to access view type instead of hard coding it (line 245 above)

    var canDelete = ds.hasRight(blist.rights.view.DELETE_VIEW) && !ds.isFederated();

    var deleteMenuItem = {
      text: $.t('controls.browse.actions.delete.button'),
      className: 'delete button',
      href: '#Delete'
    };

    var canChangePermissions = (function(context) {
      var publicGrant = _.detect(
        context.grants || [],
        function(grant) {
          return _.include(grant.flags || [], 'public');
        }
      );
      return context.hasRight(blist.rights.view.UPDATE_VIEW) &&
        !context.isFederated() &&
        (!publicGrant || !publicGrant.inherited);
    })(ds);

    var permissionsMenuItem = {
      text: $.t('controls.browse.actions.permissions.change_button.' + (ds.isPublic() ? 'public' : 'private') + '_html'),
      className: 'permissions button',
      href: '#Permissions'
    };

    var settingOpts = {
      menuButtonElement: $(settingsIcon),
      contents: _.compact([
        canChangePermissions ? permissionsMenuItem : null,
        canDelete ? deleteMenuItem : null
      ])
    };

    if (_.isEmpty(settingOpts.contents)) {
      $(settingsIcon).remove();
    } else {
      $settingsMenu.menu(settingOpts);
    }

    $settingsMenu.find('.permissions.button').click(function(e) {
      controlPermissionsButton(e, ds);
    });
    $settingsMenu.find('.delete.button').click(function(e) {
      controlDeleteButton(e, ds);
    });
  });


  // Sad hack: we don't have the stemmed version, so just highlight the words they typed.
  // Also remove special characters because they can break the regex.
  var searchRegex = '';

  if ($.subKeyDefined(blist, 'browse.searchOptions.q')) {
    searchRegex = new RegExp(blist.browse.searchOptions.q.trim().replace(/[^\w\s]/gi, '').replace(' ', '|'), 'gi');
  }

  if (!$.isBlank(searchRegex)) {
    $('table tbody tr').
    find('a.name, span.name, div.description, span.category, span.tags').
    each(function() {
      var $this = $(this);
      // For anchor tags, ensure we only modify the outerHTML.
      var aLinks = $this.find('a').map(function() {
        var $aLink = $(this);
        $aLink.html(
          $aLink.html().replace(searchRegex, '<span class="highlight">$&</span>')
        );
        return $aLink[0].outerHTML;
      });
      // For non-anchor tags, do a general text replace
      var textBits = _.map(
        $this.html().split(/<a.*\/a>/),
        function(text) {
          return text.replace(searchRegex, '<span class="highlight">$&</span>');
        }
      );

      $this.html(_.flatten(_.zip(textBits, aLinks)).join(''));
    });

    $('.browse-list-item').
    find('[data-search="highlight"]').
    find('*').
    addBack().
    contents().
    filter(function() {
      return this.nodeType === 3;
    }).
    each(function() {
      var newContent = $(this).text().replace(searchRegex, '<span class="highlight">$&</span>');
      $(this).replaceWith(newContent);
    });
  }

  var replaceBrokenThumbnails = function() {
    $browse.find('.results td.largeImage .datasetImage').each(function() {
      // Whenever a custom dataset image URL is found, we render that
      // image node but also add a hidden dataset icon node for backup.
      // If the custom image isn't present at this point in execution,
      // display the icon instead... but also listen for the load event
      // and show the image if it later becomes available, which can occur
      // under situations with even moderate latency.
      var $img = $(this);
      if (this.naturalWidth === 0) {
        $img.hide().next().show();
        $img.one('load', function() {
          if (this.naturalWidth > 0) {
            $img.show().next().hide();
          }
        });
      }
    });
  };
  replaceBrokenThumbnails();

  var renderRows = function() {
    // Render row search results, if any
    $browse.find('table tbody tr.withRows .rowSearchResults').each(function() {
      var $results = $(this);
      $results.empty(); // Remove span for matching rows.

      var ds = getDS($results);
      $results.rowSearchRenderType({
        highlight: searchRegex,
        view: ds,
        rows: _.map(ds.rowResults, function(r) {
          return RowSet.translateRow(r, ds, null, null, true); // eslint-disable-line no-undef
        }),
        query: blist.browse.searchOptions.q,
        totalRowResults: ds.rowResultCount
      });

      var $display = $results.find('.rowSearchRenderType');
      $display.removeClass('hide').css('opacity', 0);

      // Is it too tall?
      if ($results.height() > 220) {
        var $rows = $display.find('.rowList');
        $rows.data('origheight', $rows.height());
        $results.addClass('collapsed overheight');
        $results.find('.expandRowResults').click(function(event) {
          event.preventDefault();
          var expanding = $results.hasClass('collapsed'),
            newHeight = expanding ? $rows.data('origheight') : 200;
          $rows.animate({
              'max-height': newHeight
            }, 300,
            function() {
              $results.toggleClass('collapsed');
            });
          $display.find('.expandHint').
          toggleClass('upArrow downArrow').end().
          find('.fader')[expanding ? 'fadeOut' : 'fadeIn'](300);
        });
      }

      $display.animate({
        opacity: 1
      }, 300, function() {
        $display.css('opacity', '');
      });
    });
  };

  $.fn.dancingEllipsis = function(options) {
    var opts2 = $.extend({}, {
        text: '',
        interval: 700
      }, options),
      ellipsis = '',
      spans = this;

    var interval = setInterval(function() {
      ellipsis = ellipsis.length >= 3 ? '' : ellipsis + '.';
      spans.text(opts2.text + ellipsis);
    }, opts2.interval);

    return function() {
      clearInterval(interval);
    };
  };

  /*
    SavePoint uses two strategies: scroll position and mouseover.
    1) Mouse position is preferred. If a row is hovered over, scroll back to
    that row on restore. (This is scrollTarget.)
    2) Scroll position looks for the row that has the closest .offset().top
    to scrollPos(). (This is $scrollTarget.)
  */
  $.fn.savePoint = function() {
    var $this = this,
      rowOffsets = this.map(function() {
        return $(this).offset().top;
      }),
      scrollDelta = 0, // Distance between hover target and top of screen.
      scrollTarget, $scrollTarget,
      captureTarget = function() {
        scrollTarget = this;
      };

    this.mouseover(captureTarget).mouseenter(captureTarget);

    return {
      save: function() {
        var scrollPos = $(document).scrollTop(),
          index = 0,
          minDelta = Infinity;
        if (scrollTarget) {
          scrollDelta = $(scrollTarget).offset().top - scrollPos;
          return; // Have hover target. Shortcircuit now.
        }

        if (scrollPos < rowOffsets[0]) {
          return;
        }

        // Minimize delta between scrollPos and offset.top.
        _.any(rowOffsets, function(offset, i) {
          var delta = Math.abs(scrollPos - offset);
          if (delta >= minDelta) {
            return true;
          } else {
            minDelta = delta;
          }
          index = i;
        });

        $scrollTarget = $this.filter(':eq(' + index + ')');
        scrollDelta = _.get($scrollTarget.offset(), 'top', 0) - scrollPos;
      },
      restore: function() {
        if (scrollTarget) {
          $(document).scrollTop(Math.max($(scrollTarget).offset().top - scrollDelta, 0));
        } else if ($scrollTarget) {
          $(document).scrollTop(_.get($scrollTarget.offset(), 'top', 0) - scrollDelta);
        }
      }
    };
  };

  // Disable in-dataset matches for Cetera searches
  // (which should not have rowSearchResults divs)
  var rowSearchResultsEnabled = $('.rowSearchResults').length > 0;

  // Need to load rows related to the search
  if (
    rowSearchResultsEnabled &&
    !isListingViewType &&
    !$.isBlank(blist.browse.rowCount)
  ) {
    var stopEllipsis = $('.rowSearchResults span').
    dancingEllipsis({
      text: $.t('controls.browse.row_results.matching_rows')
    });

    var savePoint = $('table tr').savePoint(); // This order is important.

    Dataset.search($.extend({}, blist.browse.searchOptions, {
        row_count: blist.browse.rowCount
      }), // eslint-disable-line camelcase
      function(results) {
        _.each(results.views, function(ds) {
          if (ds.rowResultCount > 0) {
            blist.browse.datasets[ds.id] = blist.browse.datasets[ds.id] || {};
            blist.browse.datasets[ds.id].rowResults = ds.rowResults;
            blist.browse.datasets[ds.id].rowResultCount = ds.rowResultCount;
            $browse.find('table tbody tr[data-viewid="' + ds.id + '"]').addClass('withRows');
          }
        });
        savePoint.save();
        stopEllipsis();
        renderRows();
        $('.rowSearchResults > span').text($.t('controls.browse.row_results.no_matching_rows'));
        savePoint.restore();
      });
  }

  // Handle sidebar facets
  var $searchSection = $browse.find('.searchSection');
  var $searchBox = $searchSection.find('.searchBox');
  var $clearSearch = $searchSection.find('.clearSearch');

  var hookSearch = function(e) {
    var searchTerm = $searchBox.val();
    var clearSearchClicked = _.include(e.target.parentElement.classList, 'clearSearch');

    $searchBox.attr('disabled', true);
    $searchSection.find('> .icon').toggle();
    $searchSection.find('.searchStatusWrapper').toggle();
    e.preventDefault();

    _.defer(function() {
      var newOpts = $.extend({}, opts, {
        q: encodeURIComponent(searchTerm)
      });
      var resolveEvent = function() {
        doBrowse(newOpts);
      };

      if ($.isBlank(newOpts.q) || clearSearchClicked) {
        delete newOpts.q;
      } else {
        delete newOpts.sortPeriod;
        newOpts.sortBy = 'relevance';
      }

      if (!blist.mixpanelLoaded) {
        resolveEvent();
      } else {
        var mixpanelNS = blist.namespace.fetch('blist.mixpanel');
        mixpanelNS.delegateCatalogSearchEvents(
          clearSearchClicked ? 'Cleared Search Field' : 'Used Search Field', {
            'Catalog Version': 'browse1'
          },
          resolveEvent
        );
      }
    });
  };

  if ($searchSection.length > 0) {
    $searchSection.submit(hookSearch).children('.icon').click(hookSearch);
  }
  if ($clearSearch.length > 0) {
    $clearSearch.submit(hookSearch).children('.icon').click(hookSearch);
  }

  $browse.find('.facetSection .moreLink').click(function(e) {
    e.preventDefault();
    var $t = $(this);
    var $options = $t.siblings('.moreOptions');

    $t.toggleClass('expanded');
    if ($t.hasClass('expanded')) {
      $t.text($.t('controls.browse.actions.less_options'));
      $options.hide().removeClass('hide').slideDown();
    } else {
      $options.slideUp();
      $t.text($.t('controls.browse.actions.all_options'));
    }
  });

  $browse.find('.facetSection .cloudLink').click(function(event) {
    event.preventDefault();
    var $dialog = $('#browseDialog_' + $(this).attr('rel'));
    $dialog.find('.optionsContent a').tagcloud({
      size: {
        start: 1.2,
        end: 2.8,
        unit: 'em'
      }
    });
    $dialog.jqmShow();

    _.defer(function() {
      $dialog.find('.optionsContent a:first').focus();
    });
  });

  $.live('a[rel*=externalDomain]', 'click', function(e) {
    e.preventDefault();

    var $a = $(this);
    var ds = getDS($a);
    var href = $a.attr('href');
    var description = ds.description;
    if (description && description.length > 128) {
      description = description.substring(0, 128) + '...';
    }
    description = $.htmlEscape(description).linkify('rel="nofollow"');
    var $modal = $('.externalDomainNotice');
    $modal.find('.leavingLink').attr('href', href).text(href);
    $modal.find('.accept.button').attr('href', href);
    $modal.find('.datasetType').text(ds.displayName);
    $modal.find('.externalDomain').attr('href', ds.domainUrl).
    text(ds.domainCName);
    $modal.find('.dsName').text(ds.name).end().
    find('.dsDesc').html(description);
    $modal.jqmShow();
  });

  // blist.iframeHack belongs in the parent window and listens for a modifier key.
  if (window != window.parent &&
    window.parent.blist &&
    window.parent.blist.iframeHack) {
    $browse.on('click', 'a[rel=external]', function(event) {
      if (!window.parent.blist.iframeHack.isModified()) {
        event.preventDefault();
        event.stopPropagation();
        window.parent.location = $(this).attr('href');
      }
    });
  }

  // Wire up the dropdown buttons for creating stories and measures. Both types
  // of asset share a common approach for creation: allocating a view, then
  // publishing it, then redirecting to some appropriate page where the user can
  // begin editing their asset. The method below encapsulates that workflow; the
  // respective click handlers follow.
  //
  // TODO: I don't think it's really appropriate for this to be part of the
  // `browse.js` file, since it has nothing to do with the catalog.
  //
  // NOTE: See other very important information at
  //  common/site_chrome/app/assets/javascripts/socrata_site_chrome/admin_header.js

  function createPublishedView(metadata) {
    // You can't perform this operation without an app token.
    var appToken = getAppToken();
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
          'X-App-Token': appToken
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
            'X-App-Token': appToken
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

  function getAppToken() {
    return blist && blist.configuration && blist.configuration.appToken;
  }

  // Ensure that a valid 4x4 was generated.
  function validate4x4(testString) {
    return /^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(testString);
  }

  // Add a datestring to a generic title.
  function generateDatedTitle(title) {
    var now = new Date();
    var datePieces = [
      String(now.getMonth() + 1).padStart(2, 0),
      String(now.getDate()).padStart(2, 0),
      now.getFullYear()
    ];
    return title + ' - ' + datePieces.join('-');
  }

  $(document).on(
    'click',
    '#create-story-button, #create-story-footer-button',
    function(event) {
      event.preventDefault();

      var $dropdownElement = $(this).closest('.jq-dropdown');

      var defaultTitle = blist.translations.shared.site_chrome.header.create_menu.default_story_title;
      var metadata = {
        displayFormat: {},
        displayType: 'story',
        metadata: {
          availableDisplayTypes: ['story'],
          // Since Storyteller has its own datastore, we will
          // need to treat this asynchonously. Tagging the
          // metadata with '"initialized": false' should at least
          // allow us to understand how many of the two-phase
          // story creation actions fail, and should also allow
          // us to do some garbage collection down the road.
          initialized: false,
          // Because of an unfortunate legacy in Core Server,
          // the way that we ensure that the newly-created asset
          // is of viewType 'story' is by putting a property
          // called 'isStorytellerAsset' on the metadata object.
          isStorytellerAsset: true,
          jsonQuery: {},
          renderTypeConfig: {
            visible: {
              story: true
            }
          },
          tileConfig: {}
        },
        name: generateDatedTitle(defaultTitle),
        query: {}
      };

      $dropdownElement.addClass('working');
      createPublishedView(metadata).then(
        function(uid) { window.location.href = '/stories/s/' + uid + '/create'; },
        function(error) {
          $dropdownElement.removeClass('working');
          console.error(error);
          alert(blist.translations.controls.browse.generic_error);
        }
      );
    }
  );

  $(document).on(
    'click',
    '#create-measure-button, #create-measure-footer-button',
    function(event) {
      event.preventDefault();

      var $dropdownElement = $(this).closest('.jq-dropdown');

      var defaultTitle = blist.translations.shared.site_chrome.header.create_menu.default_measure_title;
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
        name: generateDatedTitle(defaultTitle),
        query: {}
      };

      $dropdownElement.addClass('working');
      createPublishedView(metadata).then(
        function(uid) { window.location.href = '/d/' + uid + '/edit'; },
        function(error) {
          $dropdownElement.removeClass('working');
          console.error(error);
          alert(blist.translations.controls.browse.generic_error);
        }
      );
    }
  );
});
