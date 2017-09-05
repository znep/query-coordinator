/**
  This file is a slimmed down version of screens/browse2.js to support the basic catalog functionality
  needed for a Catalog Landing Page.
  browse2.js cannot be used in a page using the styleguide layout, because things like window.blist are
  undefined.

  Long-term TODO: re-build the catalog as a React Component.
*/

import _ from 'lodash';
import $ from 'jquery';
require('jquery-ui-bundle');

const MIN_DESKTOP_WIDTH = 768;
// 2x the CSS line-height (24px) for description <div>s and <p>s + 10px for padding
const DESCRIPTION_TRUNCATION_THRESHOLD = 58;

const mobileScreenWidth = () => {
  return ($(window).width() <= MIN_DESKTOP_WIDTH);
};

const showBrowse2MobileLoadingSpinner = () => {
  $('.browse2-loading-spinner-container').show();
};

const hideBrowse2MobileLoadingSpinner = () => {
  $('.browse2-loading-spinner-container').hide();
};

const hideCLPManager = () => {
  document.cookie = 'hide-clp-manager=true; expires=0; path=/';
  $('.browse2-manage-catalog-landing-page').hide();
};

const showCLPHelpFlyout = () => {
  $('#clp-help-flyout').show();
};

const hideCLPHelpFlyout = () => {
  $('#clp-help-flyout').hide();
};

const doBrowse = (newOpts) => {
  // Reset page
  delete newOpts.page;

  const baseUrl = window.location.href.split('?')[0];
  const newUrlParams = _.map(newOpts, function(value, key) {
    if (_.isArray(value)) {
      return _.map(value, function(subValue) {
        return `${key}=${subValue}`;
      }).join('&');
    }
    return `${key}=${value}`;
  }).join('&');

  window.location = `${baseUrl}?${newUrlParams}`;
};

const toggleBrowse2FacetDisplay = (event, target) => {
  const $sectionContainer = $(target).closest('.browse2-facet-section');
  const currentDisplay = $sectionContainer.attr('data-facet-display');

  if (currentDisplay === 'show') {
    $sectionContainer.attr('data-facet-display', 'hide');
  } else {
    $sectionContainer.attr('data-facet-display', 'show');
  }

  $sectionContainer.children('ul.browse2-facet-section-options').slideToggle('fast');
};

const toggleBrowse2FacetChildOptionDropdown = (event) => {
  event.preventDefault();
  event.stopPropagation();
  $(event.target).closest('li').find('.browse2-facet-section-child-options').slideToggle('fast');
};

// Mobile menu
const toggleBrowse2MobileFacetsSlideout = (event) => {
  event.preventDefault();
  const $facetPaneSection = $('.browse2-facets-pane, .browse2-mobile-facets-filter-button');
  // Slide out other main elements on page when the mobile facet section slides in
  const $mainPageElements = $(
    ['.siteContentWrapper > ul.featuredViews', '.browse2-search', '.browse2-mobile-filter',
      '.browse2-results-pane', '#siteHeader', '#site-chrome-header', '#siteFooter', '#site-chrome-footer'
    ].join(', ')
  );

  const action = 'slide';
  const time = 200;
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
};

// When the user clicks a filter option in the active filter section, it means they are
// clearing the filter. This finds the clicked option in the facet dropdown section below
// and removes the "active" class, then removes the option from the active filter section.
const browse2MobileActiveFilterClick = (event) => {
  const $facetOption = $('.browse2-facet-section[{0}="{1}"]'.
    format('data-facet-option-type', $(event.target).data('facetOptionType'))).
    find('.browse2-facet-section-option[{0}="{1}"], .browse2-facet-section-child-option[{0}="{1}"]'.
      format('data-facet-option-value', $(event.target).data('facetOptionValue')));
  $facetOption.removeClass('active');
  // Remove option from active filter section
  $(event.target).fadeOut('fast');
};

const browse2MobileFacetClick = (event) => {
  // Non-mobile: return and let the facet follow its href.
  if (!mobileScreenWidth()) {
    return;
  }

  // In mobile mode: prevent the link href and toggle the 'active' class
  event.preventDefault();
  const facetOptionIsCurrentlyActive = $(event.target).hasClass('active');

  // There can only be one active facet per section. Remove other active facet if any.
  $(event.target).
    closest('.browse2-facet-section').
    find('.active').
    removeClass('active');

  if (!facetOptionIsCurrentlyActive) {
    $(event.target).addClass('active');
  }
};

const filterBrowse2MobileFacets = () => {
  const facetFilters = {};
  let urlParams = {};

  // Get all filter facet options that are currently active and store them in facetFilters
  $('.browse2-facet-section-option.active, .browse2-facet-section-child-option.active').each((i, option) => {
    const paramKey = $(option).closest('.browse2-facet-section').data('facetOptionType');
    const paramValue = $(option).data('facetOptionValue');
    facetFilters[paramKey] = paramValue;
  });

  // Get all params present in the url currently
  const oldUrlParamString = location.search.substring(1);
  if (oldUrlParamString) {
    urlParams = JSON.parse('{"{0}"}'.format(
      decodeURI(oldUrlParamString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"')
    ));
  }

  // Remove all existing filter facets from url params
  $('.browse2-facet-section').each((i, section) => {
    const facetType = $(section).data('facetOptionType');
    delete urlParams[facetType];
  });

  // Also delete the "page" offset parameter if it is present
  delete urlParams.page;

  // Add the current active facetFilters into the urlParams
  urlParams = $.param(_.merge(urlParams, facetFilters));

  // Render a loading spinner and open the new url.
  showBrowse2MobileLoadingSpinner();

  window.addEventListener('pagehide', () => {
    hideBrowse2MobileLoadingSpinner();
  });

  // Safari needs an extra frame before loading the new page to render the loading spinner
  _.defer(() => {
    location.href = '/browse?{0}'.format(urlParams);
  });
};

const browse2MobileFacetClearAll = (event) => {
  event.preventDefault();
  $('.browse2-facet-section-option.active, .browse2-facet-section-child-option.active').
    removeClass('active');
  filterBrowse2MobileFacets();
};

// Store the overflow property values as data attributes on the facet modal so we can restore
// it once the modal is hidden.
const storeOverflowPropertyInModal = (element) => {
  const overflowX = $(element).css('overflow-x');
  const overflowY = $(element).css('overflow-y');
  $('.browse2-facet-section-modal').data('{0}OverflowX'.format(element), overflowX);
  $('.browse2-facet-section-modal').data('{0}OverflowY'.format(element), overflowY);
};

const restoreOverflowProperty = (element) => {
  const overflowX = $('.browse2-facet-section-modal').data('{0}OverflowX'.format(element));
  const overflowY = $('.browse2-facet-section-modal').data('{0}OverflowY'.format(element));
  const defaultOverflow = 'initial';
  $(element).css({
    'overflow-x': overflowX || defaultOverflow,
    'overflow-y': overflowY || defaultOverflow
  });
};

const hideBrowse2FacetModal = () => {
  $('.browse2-facet-section-modal').addClass('hidden');
  restoreOverflowProperty('html');
  restoreOverflowProperty('body');
  $('.siteOuterWrapper').attr('aria-hidden', false);
};

const hideBrowse2FacetModalOnEscape = () => {
  $(document).keyup((e) => {
    if (e.keyCode === 27) {
      hideBrowse2FacetModal();
    }
  });
};

const showBrowse2FacetModal = (event) => {
  event.preventDefault();
  // Set height of modal based on user's window size
  const modalVerticalMargins = 40;
  const modalHeaderFooterHeight = 120;
  const modalContentMaxHeight = window.innerHeight - (modalVerticalMargins * 2) - modalHeaderFooterHeight;
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
  const chosenFacet = $(event.currentTarget).data('modalFacet');
  $('.browse2-facet-section-modal[data-modal-facet="{0}"]'.format(chosenFacet)).removeClass('hidden');
  $('.browse2-facet-section-modal-container h1').focus();
  $('.siteOuterWrapper').attr('aria-hidden', true);
  hideBrowse2FacetModalOnEscape();
};

const truncateDescription = (element) => {
  $(element).dotdotdot({
    height: DESCRIPTION_TRUNCATION_THRESHOLD,
    callback: function(isTruncated) {
      if (isTruncated) {
        $(this).parent('.browse2-result-description-container').
        attr('data-description-display', 'truncate');
      }
    }
  });
};

const toggleBrowse2DescriptionTruncation = (event) => {
  event.preventDefault();
  const sectionContainer = $(event.target).closest('.browse2-result-description-container');
  const currentDisplay = sectionContainer.attr('data-description-display');

  if (currentDisplay === 'show') {
    truncateDescription(sectionContainer.children('.browse2-result-description'));
  } else {
    sectionContainer.attr('data-description-display', 'show');
    sectionContainer.children('.browse2-result-description').trigger('destroy');
  }
};

$(document).ready(() => {
  const opts = {};
  const $facetHeaders = $('.browse2-facet-section-title');
  const $sortType = $('#browse2-sort-type');

  if (!_.isEmpty(window.location.search)) {
    _.each(
      window.location.search.slice(1).split('&'),
      function(urlParam) {
        const urlParamKey = unescape(urlParam.split('=')[0]);
        const urlParamValue = urlParam.split('=')[1];

        if (/\[\]$/.test(urlParamKey)) {
          if (_.isEmpty(opts[urlParamKey])) {
            opts[urlParamKey] = [];
          }

          opts[urlParamKey].push(urlParamValue);
        } else {
          opts[urlParamKey] = urlParamValue;
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

  // Don't forget to also check here: platform-ui/frontend/public/javascripts/screens/browse2.js
  // Result description truncation
  $('.browse2-result-description').each((index, element) => {
    let descriptionHeight = 0;
    $(element).children().each((i, childElement) => {
      descriptionHeight += $(childElement).outerHeight(true);
    });

    if (descriptionHeight >= DESCRIPTION_TRUNCATION_THRESHOLD) {
      truncateDescription(element);
    }
  });

  // Listeners
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

  $facetHeaders.onClickOrEnter(function(event) { toggleBrowse2FacetDisplay(event, event.target); });

  $sortType.on('change', () => {
    _.defer(() => {
      const newOpts = $.extend({}, opts);
      newOpts.sortBy = $sortType.val();
      doBrowse(newOpts);
    });
  });

  $('.browse2-facet-section-child-option-toggle').onClickOrEnter(
    function(event) { toggleBrowse2FacetChildOptionDropdown(event); }
  );
  $('.browse2-facet-section-modal-button').onClickOrEnter(
    function(event) { showBrowse2FacetModal(event); }
  );
  $(`.browse2-facet-section-modal-background, .browse2-facet-section-modal-close,
    .modal-close-button, .modal-close-button > a`).onClickOrEnter(hideBrowse2FacetModal);
  $('.browse2-result-description-truncation-toggle-control').onClickOrEnter(
    function(event) { toggleBrowse2DescriptionTruncation(event); }
  );
  $('.manage-clp-hide-action').onClickOrEnter(hideCLPManager);
  $('#clp-help-toggle').on('mouseover', showCLPHelpFlyout).on('mouseout', hideCLPHelpFlyout);

  // Mobile menu listeners
  $('.browse2-mobile-filter, .browse2-facets-pane-mobile-header').
    on('click', toggleBrowse2MobileFacetsSlideout);
  $('.browse2-facets-mobile-active-filter').on('click', browse2MobileActiveFilterClick);
  $('.browse2-facet-section-option, .browse2-facet-section-child-option').
    on('click', browse2MobileFacetClick);
  $('.browse2-mobile-facets-filter-button').on('click', filterBrowse2MobileFacets);
  $('.browse2-facets-pane-mobile-clear-all-button').on('click', browse2MobileFacetClearAll);
});

