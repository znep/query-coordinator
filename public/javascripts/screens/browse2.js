$(function() {
  'use strict';

  var MIN_DESKTOP_WIDTH = 885;
  // 2x the CSS line-height (24px) for description <div>s and <p>s + 10px for padding
  var DESCRIPTION_TRUNCATION_THRESHOLD = 58;

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

      if ($sortType.find('option:selected').hasClass('timePeriod')) {
        newOpts.sortPeriod = $sortPeriod.val();
      } else {
        delete newOpts.sortPeriod;
      }

      doBrowse(newOpts);
    });
  }

  function trackClearSearch(event) {
    event.preventDefault();

    _.defer(function() {
      var newOpts = $.extend({}, opts, {
        'q': encodeURIComponent(
          $searchSection.find('.browse2-search-control').val()
        ),
        'Type': {
          'Name': 'Cleared Search Field'
        }
      });

      if (!blist.mixpanelLoaded) {
        document.location = event.target.href;
      } else {
        $.updateMixpanelProperties();
        var properties = _.extend(window._genericMixpanelPayload(), newOpts);
        mixpanel.track('Cleared Search Field', properties, function() {
          document.location = event.target.href;
        });
      }
    });
  }

  function hookSearch(event) {
    event.preventDefault();

    _.defer(function() {
      var newOpts = $.extend({}, opts, {
        'q': encodeURIComponent(
          $searchSection.find('.browse2-search-control').val()
        ),
        'Type': {
          'Name': 'Used Search Field'
        }
      });

      if ($.isBlank(newOpts.q)) {
        delete newOpts.q;
      } else {
        delete newOpts.sortPeriod;
        newOpts.sortBy = 'relevance';
      }

      if (!blist.mixpanelLoaded) {
        doBrowse(newOpts);
      } else {
        $.updateMixpanelProperties();
        var properties = _.extend(window._genericMixpanelPayload(), newOpts);
        mixpanel.track('Used Search Field', properties, function() {
          doBrowse(newOpts);
        });
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

  function createNewStory(event) {

    var $button = $(this);

    function onError() {

      $button.attr('data-status', 'ready');

      alert('Oh no! There’s been a problem. Please try again.');
    }

    function onSuccess(data, textStatus, xhr) {

      function validate4x4(testString) {
        var valid = false;
        var pattern = window.blist.util.patterns.UID;

        if (pattern) {
          valid = testString.match(pattern) !== null;
        }

        return valid;
      }

      function onPublishSuccess(publishData) {

        if (publishData.hasOwnProperty('id') && validate4x4(publishData.id)) {

          // This is the second phase of the creation action,
          // and this endpoint is responsible for removing the
          // '"initialized": false' flag (or setting it to true)
          // when it succeeds at creating the new story objects
          // in Storyteller's datastore.
          //
          // This isn't perfect but it should (hopefully) be
          // reliable enough that users will not totally fail to
          // create stories when they intend to do so.
          window.location.href = '/stories/s/{0}/create'.format(publishData.id);

        } else {
          onError();
        }
      }

      if (data.hasOwnProperty('id') && validate4x4(data.id)) {
        // Next we need to publish the newly-created catalog
        // asset, since the publish action provisions a new
        // 4x4.
        var publishUrl = '/api/views/{0}/publication.json?accessType=WEBSITE'.format(data.id);
        var publishSettings = {
          contentType: false,
          error: onError,
          headers: {
            'X-App-Token': blist.configuration.appToken
          },
          type: 'POST',
          success: onPublishSuccess
        };

        $.ajax(publishUrl, publishSettings);

      } else {
        onError(xhr, 'Invalid storyUid', 'Invalid storyUid');
      }
    }

    event.preventDefault();
    event.stopPropagation();

    if (window.hasOwnProperty('blist') &&
      window.blist.hasOwnProperty('configuration') &&
      window.blist.configuration.hasOwnProperty('appToken')) {

      var newStoryName = 'Untitled Story - {0}'.format(new Date().format('m-d-Y'));
      var newStoryData = {
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
          }
        },
        name: newStoryName,
        query: {}
      };
      var url = '/api/views.json';
      var settings = {
        contentType: false,
        data: JSON.stringify(newStoryData),
        dataType: 'json',
        error: onError,
        headers: {
          'Content-type': 'application/json',
          'X-App-Token': blist.configuration.appToken
        },
        type: 'POST',
        success: onSuccess
      };

      $button.attr('data-status', 'busy');
      $.ajax(url, settings);
    }
  }

  function toggleBrowse2CreateAssetDisplay() {
    var $sectionContainer = $(this).parent('.browse2-create-asset');
    var currentDisplay = $sectionContainer.attr('data-panel-display');

    if (currentDisplay === 'show') {
      $sectionContainer.attr('data-panel-display', 'hide');
      $(this).blur();
    } else {
      $sectionContainer.attr('data-panel-display', 'show');
    }
  }

  function toggleBrowse2FacetDisplay(event, element) {
    element = element || this;
    var $sectionContainer = $(element).parent('.browse2-facet-section');
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
    var childOptionsAlreadyVisible = $(this).closest('li').find('.browse2-facet-section-child-options').is(':visible');
    $(this).closest('li').find('.browse2-facet-section-child-options').slideToggle('fast');
    this.title = childOptionsAlreadyVisible ?
      $.t('controls.browse.browse2.facets.expand.title') : $.t('controls.browse.browse2.facets.contract.title');
  }

  function toggleBrowse2MobileFacetsSlideout(event) {
    event.preventDefault();
    var $facetPaneSection = $('.browse2-facets-pane, .browse2-mobile-facets-filter-button');
    // Slide out other main elements on page when the mobile facet section slides in
    var $mainPageElements = $(
      ['.browse2-search', '.browse2-mobile-filter', '.browse2-results-pane', '#siteHeader',
        '#siteFooter'].join(', ')
    );

    var action = 'slide';
    var time = 200;
    if ($facetPaneSection.is(':visible')) {
      $mainPageElements.show(action, { direction: 'right' }, time);
      $facetPaneSection.hide(action, { direction: 'left' }, time);
    } else {
      $facetPaneSection.show(action, { direction: 'left' }, time);
      $mainPageElements.hide(action, { direction: 'right' }, time);
    }
  }

  // When the user clicks a filter option in the active filter section, it means they are
  // clearing the filter. This finds the clicked option in the facet dropdown section below
  // and removes the "active" class, then removes the option from the active filter section.
  function browse2MobileActiveFilterClick() {
    var $facetOption = $('.browse2-facet-section[{0}="{1}"]'.
      format('data-facet-option-type', $(this).data('facetOptionType'))).
      find('.browse2-facet-section-option[{0}="{1}"], .browse2-facet-section-child-option[{0}="{1}"]'.
        format('data-facet-option-value', $(this).data('facetOptionValue')));
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
        decodeURI(oldUrlParamString).
          replace(/"/g, '\\"').
          replace(/&/g, '","').
          replace(/=/g,'":"')
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
    $('body').css('overflow', 'hidden');
    var chosenFacet = $(event.currentTarget).data('modalFacet');
    $('.browse2-facet-section-modal[data-modal-facet="{0}"]'.format(chosenFacet)).removeClass('hidden');
    hideBrowse2FacetModalOnEscape();
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
    $('body').css('overflow', 'auto');
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
    var sectionContainer = $(this).parent('.browse2-result-description-container');
    var currentDisplay = sectionContainer.attr('data-description-display');

    if (currentDisplay === 'show') {
      truncateDescription(sectionContainer.children('.browse2-result-description'));
    } else {
      sectionContainer.attr('data-description-display', 'show');
      sectionContainer.children('.browse2-result-description').trigger('destroy');
    }
  }

  function makeResultPublic(event) {
    var id = $(event.target).closest('[data-result-id]').attr('data-result-id');
    var dataset;
    var url = '/views/{0}.json?accessType=WEBSITE&method=setPermission&value=public.read'.format(id);
    var makePublicSettings;

    function onMakePublicSuccess() {
      window.location.href = window.location.href;
    }

    function onMakePublicError() {
      alert(
        $.t('controls.browse.browse2.edit.make_public.error', { dataset: dataset.name })
      );
    }

    if (!(blist.browse.datasets[id] instanceof Dataset)) {
      blist.browse.datasets[id] = new Dataset(blist.browse.datasets[id]);
    }

    dataset = blist.browse.datasets[id];

    makePublicSettings = {
      contentType: false,
      error: onMakePublicError,
      headers: {
        'X-App-Token': blist.configuration.appToken
      },
      type: 'PUT',
      success: onMakePublicSuccess
    };

    $.ajax(url, makePublicSettings);
  }

  function makeResultPrivate(event) {
    var id = $(event.target).closest('[data-result-id]').attr('data-result-id');
    var dataset;
    var url = '/views/{0}.json?accessType=WEBSITE&method=setPermission&value=private'.format(id);
    var makePrivateSettings;

    function onMakePrivateSuccess() {
      window.location.href = window.location.href;
    }

    function onMakePrivateError() {
      alert(
        $.t('controls.browse.browse2.edit.make_private.error', { dataset: dataset.name })
      );
    }

    if (!(blist.browse.datasets[id] instanceof Dataset)) {
      blist.browse.datasets[id] = new Dataset(blist.browse.datasets[id]);
    }

    dataset = blist.browse.datasets[id];

    makePrivateSettings = {
      contentType: false,
      error: onMakePrivateError,
      headers: {
        'X-App-Token': blist.configuration.appToken
      },
      type: 'PUT',
      success: onMakePrivateSuccess
    };

    $.ajax(url, makePrivateSettings);
  }

  function deleteResult(event) {
    var id = $(event.target).closest('[data-result-id]').attr('data-result-id');
    var dataset;
    var url;
    var deleteSettings;

    function onDeleteSuccess() {
      window.location.href = window.location.href;
    }

    function onDeleteError() {
      alert(
        $.t('controls.browse.browse2.edit.delete.error', { dataset: dataset.name })
      );
    }

    if (!(blist.browse.datasets[id] instanceof Dataset)) {
      blist.browse.datasets[id] = new Dataset(blist.browse.datasets[id]);
    }

    dataset = blist.browse.datasets[id];

    if (dataset.isDataLens()) {
      // Send a DELETE request to the NFE endpoint, which should propagate the delete to the
      // OBE representation.
      url = '/metadata/v1/page/{0}'.format(id);
    } else {
      url = '/api/views/{0}.json'.format(id);
    }

    deleteSettings = {
      contentType: false,
      error: onDeleteError,
      headers: {
        'X-App-Token': blist.configuration.appToken
      },
      type: 'DELETE',
      success: onDeleteSuccess
    };

    if (confirm($.t('controls.browse.browse2.edit.delete.confirm', { dataset: dataset.name }))) {
      $.ajax(url, deleteSettings);
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
  var $sortPeriod = $('#browse2-sort-period');
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
  $sortPeriod.on('change', doSort);

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

  $.live(
    '#create-story-button',
    'click',
    createNewStory
  );

  // Expand facet child options list by default if it contains an "active" option
  $('.browse2-facet-section-child-option.active').closest('.browse2-facet-section-child-options').show();

  // Collapse facet options by default on mobile
  if (mobileScreenWidth()) {
    toggleBrowse2FacetDisplay(null, $('.browse2-facet-section-title'));
    $('ul.browse2-facet-section-options').hide();
  }

  // Result description truncation
  $('.browse2-result-description').each(function(index, element) {
    var descriptionHeight = 0;
    $(element).children().
      each(function(i, childElement) {
        descriptionHeight += $(childElement).outerHeight(true);
      });

    if (descriptionHeight >= DESCRIPTION_TRUNCATION_THRESHOLD) {
      truncateDescription(element);
    }
  });

  // Click listeners
  $('.browse2-create-asset-button').on('click', toggleBrowse2CreateAssetDisplay);
  $('.browse2-facet-section-title').on('click', toggleBrowse2FacetDisplay);
  $('.browse2-mobile-filter, .browse2-facets-pane-mobile-header').on('click', toggleBrowse2MobileFacetsSlideout);
  $('.browse2-facets-mobile-active-filter').on('click', browse2MobileActiveFilterClick);
  $('.browse2-facet-section-child-option-toggle').on('click', toggleBrowse2FacetChildOptionDropdown);
  $('.browse2-facet-section-option, .browse2-facet-section-child-option').on('click', browse2MobileFacetClick);
  $('.browse2-mobile-facets-filter-button').on('click', filterBrowse2MobileFacets);
  $('.browse2-facets-pane-mobile-clear-all-button').on('click', browse2MobileFacetClearAll);
  $('.browse2-facet-section-modal-button').on('click', showBrowse2FacetModal);
  $('.browse2-facet-section-modal-background, .browse2-facet-section-modal-close').click(hideBrowse2FacetModal);
  $('.browse2-result-description-truncation-toggle-control').on('click', toggleBrowse2DescriptionTruncation);
  $('.browse2-result-make-public-button').on('click', makeResultPublic);
  $('.browse2-result-make-private-button').on('click', makeResultPrivate);
  $('.browse2-result-delete-button').on('click', deleteResult);
});
