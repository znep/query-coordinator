/**
  This file is a slimmed down version of screens/browse2.js to support the basic catalog functionality
  needed for a Catalog Landing Page.
  browse2.js cannot be used in a page using the styleguide layout, because things like window.blist are
  undefined.

  Long-term TODO: re-build the catalog as a React Component.
*/

import _ from 'lodash';
import $ from 'jquery';

$(function() {
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

  function doBrowse(newOpts) {
    // Reset page
    delete newOpts.page;
    // set utf8
    newOpts.utf8 = '%E2%9C%93';

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
  }

  function toggleBrowse2FacetDisplay(event, element) {
    element = element || this;
    const $sectionContainer = $(element).parent('.browse2-facet-section');
    const currentDisplay = $sectionContainer.attr('data-facet-display');

    if (currentDisplay === 'show') {
      $sectionContainer.attr('data-facet-display', 'hide');
    } else {
      $sectionContainer.attr('data-facet-display', 'show');
    }

    $sectionContainer.children('ul.browse2-facet-section-options').slideToggle('fast');
  }

  // Listeners
  $facetHeaders.on('click', toggleBrowse2FacetDisplay);

  $sortType.on('change', function() {
    _.defer(function() {
      const newOpts = $.extend({}, opts);
      newOpts.sortBy = $sortType.val();
      doBrowse(newOpts);
    });
  });
});
