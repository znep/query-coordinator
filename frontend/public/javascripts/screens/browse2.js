$(function() {
  'use strict';

  var MIN_DESKTOP_WIDTH = 885;
  // 2x the CSS line-height (24px) for description <div>s and <p>s + 10px for padding
  var DESCRIPTION_TRUNCATION_THRESHOLD = 58;
  var mixpanelNS = blist.namespace.fetch('blist.mixpanel');

  function doBrowse(newOpts) {
    // Reset page
    delete newOpts.page;
    // set utf8
    newOpts.utf8 = '%E2%9C%93';
    // Pull real URL from JS
    window.location = blist.browse.baseURL +
      '?' +
      _.map(
        newOpts,
        function(v, k) {

          if (_.isArray(v)) {
            return _.map(
              v,
              function(subvalue) {
                return k + '=' + subvalue;
              }
            ).join('&');
          }

          return k + '=' + v;
        }
      ).join('&');
  }

  function doSort() {
    _.defer(function() {
      var newOpts = $.extend({}, opts);
      newOpts.sortBy = $sortType.val();
      doBrowse(newOpts);
    });
  }

  function trackClearSearch(event) {
    event.preventDefault();

    _.defer(function() {
      var queryProperties = {
        'Type': {
          'Name': 'Cleared Search Field',
          'Properties': {
            'Query': $searchSection.find('.browse2-search-control').val()
          }
        }
      };

      var resolveEvent = function() {
        window.location = event.target.href;
      };

      if (!blist.mixpanelLoaded) {
        resolveEvent();
      } else {
        // TODO: Don't talk to Mixpanel if it's not enabled
        mixpanelNS.delegateCatalogSearchEvents(
          'Cleared Search Field',
          queryProperties,
          resolveEvent
        );
      }
    });
  }

  function hookSearch(event) {
    event.preventDefault();

    _.defer(function() {
      var query = $searchSection.find('.browse2-search-control').val();
      var searchOptions = $.extend({}, opts, {
        'q': encodeURIComponent(query)
      });
      var mixpanelPayload = {
        'Type': {
          'Name': 'Used Search Field',
          'Properties': {
            'Query': query
          }
        }
      };

      if ($.isBlank(searchOptions.q)) {
        delete searchOptions.q;
      } else {
        searchOptions.sortBy = 'relevance';
      }

      var resolveEvent = function() {
        doBrowse(searchOptions);
      };

      if (!blist.mixpanelLoaded) {
        resolveEvent();
      } else {
        // TODO: Don't talk to Mixpanel if it's not enabled
        mixpanelNS.delegateCatalogSearchEvents(
          'Used Search Field',
          mixpanelPayload,
          resolveEvent
        );
      }
    });
  }

  function linkify(extra) {
    var replacedText;
    var replacePattern1;
    var replacePattern2;
    var replacePattern3;

    if ($.isBlank(this)) {
      return '';
    }

    if ($.isBlank(extra)) {
      extra = '';
    }

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = this.replace(replacePattern1, '<a href="$1" ' + extra + '>$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" ' + extra + '>$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
  }

  function toggleBrowse2FacetDisplay(event, element) {
    element = element || this;
    var $sectionContainer = $(element).closest('.browse2-facet-section');
    var currentDisplay = $sectionContainer.attr('data-facet-display');

    if (currentDisplay === 'show') {
      $sectionContainer.attr('data-facet-display', 'hide');
    } else {
      $sectionContainer.attr('data-facet-display', 'show');
    }

    $sectionContainer.children('ul.browse2-facet-section-options').slideToggle('fast');
  }

  function toggleBrowse2FacetChildOptionDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    $(event.target).closest('li').find('.browse2-facet-section-child-options').slideToggle('fast');
  }

  function toggleBrowse2MobileFacetsSlideout(event) {
    event.preventDefault();
    var $facetPaneSection = $('.browse2-facets-pane, .browse2-mobile-facets-filter-button');
    // Slide out other main elements on page when the mobile facet section slides in
    var $mainPageElements = $(
      ['.siteContentWrapper > ul.featuredViews', '.browse2-search', '.browse2-mobile-filter',
        '.browse2-results-pane', '#siteHeader', '#site-chrome-header', '#siteFooter', '#site-chrome-footer'
      ].join(', ')
    );

    var action = 'slide';
    var time = 200;
    if ($facetPaneSection.is(':visible')) {
      $mainPageElements.show(action, {
        direction: 'right'
      }, time);
      $facetPaneSection.hide(action, {
        direction: 'left'
      }, time);
    } else {
      $facetPaneSection.show(action, {
        direction: 'left'
      }, time);
      $mainPageElements.hide(action, {
        direction: 'right'
      }, time);
    }
  }

  // When the user clicks a filter option in the active filter section, it means they are
  // clearing the filter. This finds the clicked option in the facet dropdown section below
  // and removes the "active" class, then removes the option from the active filter section.
  function browse2MobileActiveFilterClick() {
    var $facetOption = $('.browse2-facet-section[{0}="{1}"]'.format('data-facet-option-type', $(this).data('facetOptionType'))).
    find('.browse2-facet-section-option[{0}="{1}"], .browse2-facet-section-child-option[{0}="{1}"]'.format('data-facet-option-value', $(this).data('facetOptionValue')));
    $facetOption.removeClass('active');
    // Remove option from active filter section
    $(this).fadeOut('fast');
  }

  function browse2MobileFacetClick(event) {
    // Non-mobile: return and let the facet follow its href.
    if (!mobileScreenWidth()) {
      return;
    }

    // In mobile mode: prevent the link href and toggle the 'active' class
    event.preventDefault();
    var facetOptionIsCurrentlyActive = $(this).hasClass('active');

    // There can only be one active facet per section. Remove other active facet if any.
    $(this).closest('.browse2-facet-section').
    find('.active').
    removeClass('active');

    if (!facetOptionIsCurrentlyActive) {
      $(this).addClass('active');
    }
  }

  function browse2MobileFacetClearAll(event) {
    event.preventDefault();
    $('.browse2-facet-section-option.active, .browse2-facet-section-child-option.active').
    removeClass('active');
    filterBrowse2MobileFacets();
  }

  function filterBrowse2MobileFacets() {
    var facetFilters = {};
    var urlParams = {};

    // Get all filter facet options that are currently active and store them in facetFilters
    $('.browse2-facet-section-option.active, .browse2-facet-section-child-option.active').each(function() {
      var paramKey = $(this).closest('.browse2-facet-section').data('facetOptionType');
      var paramValue = $(this).data('facetOptionValue');
      facetFilters[paramKey] = paramValue;
    });

    // Get all params present in the url currently
    var oldUrlParamString = location.search.substring(1);
    if (oldUrlParamString) {
      urlParams = JSON.parse('{"{0}"}'.format(
        decodeURI(oldUrlParamString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"')
      ));
    }

    // Remove all existing filter facets from url params
    $('.browse2-facet-section').each(function() {
      var facetType = $(this).data('facetOptionType');
      delete urlParams[facetType];
    });

    // Also delete the "page" offset parameter if it is present
    delete urlParams.page;

    // Add the current active facetFilters into the urlParams
    urlParams = $.param(_.merge(urlParams, facetFilters));

    // Render a loading spinner and open the new url.
    showBrowse2MobileLoadingSpinner();

    window.addEventListener('pagehide', function() {
      hideBrowse2MobileLoadingSpinner();
    });

    // Safari needs an extra frame before loading the new page to render the loading spinner
    window.setTimeout(function() {
      location.href = '/browse?{0}'.format(urlParams);
    }, 0);
  }

  function showBrowse2FacetModal(event) {
    event.preventDefault();
    // Set height of modal based on user's window size
    var modalVerticalMargins = 40;
    var modalHeaderFooterHeight = 120;
    var modalContentMaxHeight = window.innerHeight - (modalVerticalMargins * 2) - modalHeaderFooterHeight;
    $('.browse2-facet-section-modal-container').css({
      'margin': '{0}px auto'.format(modalVerticalMargins)
    });
    $('.browse2-facet-section-modal-content').css({
      'max-height': '{0}px'.format(modalContentMaxHeight)
    });
    // Prevent the normal body scroll and show the modal
    storeOverflowPropertyInModal('html');
    storeOverflowPropertyInModal('body');
    $('html, body').css('overflow', 'hidden');
    var chosenFacet = $(event.currentTarget).data('modalFacet');
    $('.browse2-facet-section-modal[data-modal-facet="{0}"]'.format(chosenFacet)).removeClass('hidden');
    $('.browse2-facet-section-modal-container h1').focus();
    $('.siteOuterWrapper').attr('aria-hidden', true);
    hideBrowse2FacetModalOnEscape();
  }

  // Store the overflow property values as data attributes on the facet modal so we can restore
  // it once the modal is hidden.
  function storeOverflowPropertyInModal(element) {
    var overflowX = $(element).css('overflow-x');
    var overflowY = $(element).css('overflow-y');
    $('.browse2-facet-section-modal').data('{0}OverflowX'.format(element), overflowX);
    $('.browse2-facet-section-modal').data('{0}OverflowY'.format(element), overflowY);
  }

  function restoreOverflowProperty(element) {
    var overflowX = $('.browse2-facet-section-modal').data('{0}OverflowX'.format(element));
    var overflowY = $('.browse2-facet-section-modal').data('{0}OverflowY'.format(element));
    var defaultOverflow = 'initial';
    $(element).css({
      'overflow-x': overflowX || defaultOverflow,
      'overflow-y': overflowY || defaultOverflow
    });
  }

  function hideBrowse2FacetModalOnEscape() {
    $(document).keyup(function(e) {
      if (e.keyCode == 27) {
        hideBrowse2FacetModal();
      }
    });
  }

  function hideBrowse2FacetModal() {
    $('.browse2-facet-section-modal').addClass('hidden');
    restoreOverflowProperty('html');
    restoreOverflowProperty('body');
    $('.siteOuterWrapper').attr('aria-hidden', false);
  }

  function truncateDescription(element) {
    $(element).dotdotdot({
      height: DESCRIPTION_TRUNCATION_THRESHOLD,
      callback: function(isTruncated) {
        if (isTruncated) {
          $(this).parent('.browse2-result-description-container').
          attr('data-description-display', 'truncate');
        }
      }
    });
  }

  function toggleBrowse2DescriptionTruncation(event) {
    event.preventDefault();
    var sectionContainer = $(event.target).closest('.browse2-result-description-container');
    var currentDisplay = sectionContainer.attr('data-description-display');

    if (currentDisplay === 'show') {
      truncateDescription(sectionContainer.children('.browse2-result-description'));
    } else {
      sectionContainer.attr('data-description-display', 'show');
      sectionContainer.children('.browse2-result-description').trigger('destroy');
    }
  }

  function showBrowse2MobileLoadingSpinner() {
    $('.browse2-loading-spinner-container').show();
  }

  function hideBrowse2MobileLoadingSpinner() {
    $('.browse2-loading-spinner-container').hide();
  }

  function mobileScreenWidth() {
    return ($(window).width() < MIN_DESKTOP_WIDTH);
  }

  function hideCLPManager() {
    document.cookie = 'hide-clp-manager=true; expires=0; path=/';
    $('.browse2-manage-catalog-landing-page').hide();
  }

  function showCLPHelpFlyout() {
    $('#clp-help-flyout').show();
  }

  function hideCLPHelpFlyout() {
    $('#clp-help-flyout').hide();
  }

  var $browse = $('.browse2');
  // alias this method so external scripts can get at it
  var getDS = blist.browse.getDS = function($item) {
    var id = $item.closest('.browse2-result').attr('data-view-id');

    if (!(blist.browse.datasets[id] instanceof Dataset)) {
      blist.browse.datasets[id] = new Dataset(blist.browse.datasets[id]);
    }

    return blist.browse.datasets[id];
  };
  var opts = {};
  var $sortType = $('#browse2-sort-type');
  var $searchSection = $browse.find('.browse2-search');

  if (!$.isBlank(window.location.search)) {
    _.each(
      window.location.search.slice(1).split('&'),
      function(p) {
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
      }
    );
  }

  if ($searchSection.length > 0) {
    $searchSection.submit(hookSearch);
    $searchSection.children('.browse2-search-mobile-search-button').click(hookSearch);
    $searchSection.children('.browse2-clear-search-icon').click(trackClearSearch);
  }

  $sortType.on('change', doSort);

  $.live(
    'a[rel*=externalDomain]',
    'click',
    function(event) {
      event.preventDefault();

      var $a = $(this);
      var ds = getDS($a);
      var href = $a.attr('href');
      var description = ds.description || '';
      var $modal = $('.externalDomainNotice');

      if (description.length > 128) {
        description = description.substring(0, 128) + '...';
      }

      description = linkify($.htmlEscape(description), 'rel="nofollow"');

      $modal.
      find('.leavingLink').
      attr('href', href).
      text(href);

      $modal.
      find('.accept.button').
      attr('href', href);

      $modal.
      find('.datasetType').
      text(ds.displayName);

      $modal.
      find('.externalDomain').
      attr('href', ds.domainUrl).
      text(ds.domainCName);

      $modal.
      find('.browse2-external-link-title').
      text(ds.name).
      end().
      find('.browse2-external-link-description').
      html(description);

      $modal.jqmShow();
    }
  );

  // blist.iframeHack belongs in the parent window and listens for a modifier key.
  if (window != window.parent &&
    window.parent.blist &&
    window.parent.blist.iframeHack) {

    $browse.on(
      'click',
      'a[rel=external]',
      function(event) {

        if (!window.parent.blist.iframeHack.isModified()) {
          event.preventDefault();
          event.stopPropagation();

          window.parent.location = $(this).attr('href');
        }
      }
    );
  }

  // Expand facet child options list by default if it contains an "active" option
  $('.browse2-facet-section-child-option.active').closest('.browse2-facet-section-child-options').show();

  // Collapse facet options by default on mobile
  if (mobileScreenWidth()) {
    toggleBrowse2FacetDisplay(null, $('.browse2-facet-section-title'));
    $('ul.browse2-facet-section-options').hide();
  }

  // Don't forget to also check here: platform-ui/frontend/public/javascripts/catalogLandingPage/catalog.js
  // Result description truncation
  $('.browse2-result-description').each(function(index, element) {
    var descriptionHeight = 0;
    $(element).children().each(function(i, childElement) {
      descriptionHeight += $(childElement).outerHeight(true);
    });

    if (descriptionHeight >= DESCRIPTION_TRUNCATION_THRESHOLD) {
      truncateDescription(element);
    }
  });

  $.fn.extend({
    onClickOrEnter: function(callback) {
      return this.on('click', function(event) { callback(event); }).
        keyup(function(event) {
          if (event.keyCode === 13) {
            callback(event);
          }
        });
    }
  });

  // Click listeners
  $('.browse2-facet-section-title').onClickOrEnter(
    function(event) { toggleBrowse2FacetDisplay(event, event.target); });
  $('.browse2-mobile-filter, .browse2-facets-pane-mobile-header').on('click', toggleBrowse2MobileFacetsSlideout);
  $('.browse2-facets-mobile-active-filter').on('click', browse2MobileActiveFilterClick);
  $('.browse2-facet-section-child-option-toggle').onClickOrEnter(
    function(event) { toggleBrowse2FacetChildOptionDropdown(event); });
  $('.browse2-facet-section-option, .browse2-facet-section-child-option').on('click', browse2MobileFacetClick);
  $('.browse2-mobile-facets-filter-button').on('click', filterBrowse2MobileFacets);
  $('.browse2-facets-pane-mobile-clear-all-button').on('click', browse2MobileFacetClearAll);
  $('.browse2-facet-section-modal-button').onClickOrEnter(
    function(event) { showBrowse2FacetModal(event); });
  $('.browse2-facet-section-modal-background, .browse2-facet-section-modal-close, .modal-close-button, .modal-close-button > a').
    onClickOrEnter(hideBrowse2FacetModal);
  $('.browse2-result-description-truncation-toggle-control').onClickOrEnter(
    function(event) { toggleBrowse2DescriptionTruncation(event); });
  $('.manage-clp-hide-action').onClickOrEnter(hideCLPManager);
  $('#clp-help-toggle').on('mouseover', showCLPHelpFlyout).on('mouseout', hideCLPHelpFlyout);
});
