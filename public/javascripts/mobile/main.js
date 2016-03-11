/* global pageMetadata, datasetMetadata, socrataConfig */

/*
* QFB components
*/
var mobileColumnChart = require('./mobile.columnchart.js');
var mobileTimelineChart = require('./mobile.timelinechart.js');
var mobileFeatureMap = require('./mobile.featuremap.js');
var mobileChoroplethMap = require('./mobile.choroplethmap.js');
var mobileTable = require('./mobile.table.js');

require('./../../../node_modules/leaflet/dist/leaflet.css');
require('./../../../node_modules/socrata-visualizations/dist/socrata-visualizations.css');

/*
* QFB components
*/
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import FilterContainer from './react-components/qfb/filtercontainer/FilterContainer.js';

(function() {
  'use strict';

  var $dlName = $('.dl-name');
  $dlName.html(datasetMetadata.name);

  function getPageTemplate() {

    var intro;
    var hasLongVersion;

    if (datasetMetadata.description.length > 85) {
      intro = datasetMetadata.description.substring(0, 85);
      hasLongVersion = true;
    } else {
      hasLongVersion = false;
    }

    if (hasLongVersion) {
      return $(
        [
          '<p class="intro padding">',
            '<span class="dl-description intro-short">' + intro + '</span>',
            '<span class="text-link">Show more</span>',
          '</p>',
          '<div class="all hidden">',
            '<div class="source-pill">Official</div>',
            '<p class="padding">',
              '<span class="dl-description">' + datasetMetadata.description + '</span>',
              '<span class="text-link">Collapse details</span>',
            '</p>',
            '<div class="meta-container">',
              '<div class="title-section padding">',
                '<h3 class="meta-title alpha">Source Dataset</h3>',
                '<h3 class="dl-name meta-title beta"></h3>',
              '</div>',
              '<div class="padding">',
                '<div class="meta-desc">',
                  '<p>All data powering this page is available for download and/or can be accessed via API from the desktop version of this site</p>',
                  '<p class="meta-go-link">Tap here to go to the desktop version &raquo;</p>',
                '</div>',
              '</div>',
            '</div>',
          '</div>'
        ].join('')
      );
    } else {
      return $(
        [
          '<p class="intro padding">',
            '<span class="dl-description">' + datasetMetadata.description + '</span>',
          '</p>',
          '<div class="all hidden">',
            '<div class="source-pill">Official</div>',
            '<div class="meta-container">',
              '<div class="title-section padding">',
                '<h3 class="meta-title alpha">Source Dataset</h3>',
                '<h3 class="dl-name meta-title beta"></h3>',
              '</div>',
              '<div class="padding">',
                '<div class="meta-desc">',
                  '<p>All data powering this page is available for download and/or can be accessed via API from the desktop version of this site</p>',
                  '<p class="meta-go-link">Tap here to go to the desktop version &raquo;</p>',
                '</div>',
              '</div>',
            '</div>',
          '</div>'
        ].join('')
      );
    }
  }

  function getTemplate(options) {

    var intro;
    var hasLongVersion;
    if (options.metaData.description.length > 85) {
      intro = options.metaData.description.substring(0,85);
      hasLongVersion = true;
    } else {
      hasLongVersion = false;
    }

    if (hasLongVersion) {
      return $(
        [
          '<div class="component-container ' + options.containerClass + '">',
          '<article class="intro-text">',
            '<h5>' + options.metaData.name + '</h5>',
            '<p class="intro padding">',
            '<span class="desc intro-short">' + intro + '</span>',
            '<span class="text-link">Show more</span>',
            '</p>',
          '<div class="all hidden">',
            '<p class="padding">',
            '<span class="desc">' + options.metaData.description + '</span>',
            '<span class="text-link">Collapse details</span>',
            '</p>',
          '</div>',
          '</article>',
          '<div class="' + options.componentClass + '"></div>',
          '</div>'
        ].join('')
      );
    } else {
      return $(
        [
          '<div class="component-container ' + options.containerClass + '">',
          '<article class="intro-text">',
            '<h5>' + options.metaData.name + '</h5>',
            '<p class="intro padding">',
            '<span class="desc">' + options.metaData.description + '</span>',
            '</p>',
          '</article>',
          '<div class="' + options.componentClass + '"></div>',
          '</div>'
        ].join('')
      );
    }
  }

  $('#button-toggle-metadata').on('click', function(){
    var showing = $(this).data('open');
    var self = $(this);

    if (showing) {
      self.html('show metadata');
      self.data('open', false);
    } else {
      self.html('hide metadata');
      self.data('open', true);
    }
    $metadataContent.toggleClass('hidden');
  });

  function mobileCardViewer() {

    var $intro = $('.intro');
    var $all = $('.all');

    $intro.find('.text-link').on('click', function() {
      // show all desc
      $(this).parents('.intro-text').find('.all').removeClass('hidden');
      $(this).parent('.intro').addClass('hidden');
    });

    $all.find('.text-link').on('click', function() {
      // show intro desc
      $(this).parents('.intro-text').find('.intro').removeClass('hidden');
      $(this).parents('.all').addClass('hidden');
    });

    var $window = $(window);
    var $navbar = $('.navbar');
    var lastScrollTop = 0;
    var wasScrollingDown = false;

    $window.scroll(function() {
      var stp = $window.scrollTop();

      if (stp > lastScrollTop) {
        if (!wasScrollingDown) {
          $navbar.
            removeClass('navbar-visible').
            addClass('navbar-hidden');
          $('#navbar').
            removeClass('in').
            attr('aria-expanded','false');

          wasScrollingDown = true;
        }
      } else {
        if (wasScrollingDown) {
          $navbar.
            removeClass('navbar-hidden').
            addClass('navbar-visible');

          wasScrollingDown = false;
        }
      }
      lastScrollTop = stp;
    });
  }

  function findObjectWithProperties(name) {
    var obj = {};
    _.each(datasetMetadata.columns, function(column, fieldName) {
      if (name == fieldName) {
        obj.position = column.position;
        obj.name = column.name;
      }
    });

    return obj;
  }

  function renderCards() {
    var $cardContainer;
    var values;
    var aPredefinedFilters = [];

    $.each(pageMetadata.cards, function(i, card) {
      var cardOptions = {
        componentClass: '',
        metaData: datasetMetadata.columns[card.fieldName],
        containerClass: ''
      };

      switch (card.cardType) {
        case 'search':
          var filterObj = {
            id: findObjectWithProperties(card.fieldName).position,
            type: 'string',
            name: card.fieldName,
            displayName: findObjectWithProperties(card.fieldName).name,
            data: null,
            startWithClosedFlannel: true
          };
          aPredefinedFilters.push(filterObj);
          break;
        case 'timeline':
          cardOptions.componentClass = 'timeline-chart';
          cardOptions.containerClass = 'timeline-chart-container';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName
          };

          mobileTimelineChart(values, $cardContainer.find('.' + cardOptions.componentClass));
          break;
        case 'feature':
          cardOptions.componentClass = 'feature-map';
          cardOptions.containerClass = 'map-container';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName
          };

          mobileFeatureMap(values, $($cardContainer.find('.' + cardOptions.componentClass)));
          break;
        case 'choropleth':
          cardOptions.componentClass = 'choropleth';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName,
            // TODO Write some bloody error handling
            computedColumnName: card.computedColumn,
            geojsonUid: datasetMetadata.columns[card.computedColumn].computationStrategy.parameters.region.substring(1),
            map_extent: (card.cardOptions) ? card.cardOptions.mapExtent || {} : {}
          };

          mobileChoroplethMap(values, $cardContainer.find('.' + cardOptions.componentClass));
          break;
        case 'column':
          cardOptions.componentClass = 'column-chart';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName
          };

          mobileColumnChart(values, $cardContainer.find('.' + cardOptions.componentClass));
          break;
        case 'table':
          cardOptions.id = 'table';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName
          };

          mobileTable(values, $cardContainer.find('#table'));
          break;
        default:
          break;
      }
    });

    getPageTemplate().appendTo('#introText');
    mobileCardViewer();
    setupQfb(aPredefinedFilters);
  }

  function setupQfb(preloadedFilters) {

    var aFilterOps = [];
    _.each(datasetMetadata.columns, function(column, fieldName) {
      var filterOption = {};
      switch (column.dataTypeName) {
        case 'text':
          filterOption = {
            filterName: column.name,
            name: fieldName,
            id: column.position,
            type: 'string'
          };
          aFilterOps.push(filterOption);
          break;
        case 'number':
          filterOption = {
            filterName: column.name,
            name: fieldName,
            id: column.position,
            type: 'int'
          };
          aFilterOps.push(filterOption);
          break;
        case 'calendar_date':
          filterOption = {
            filterName: column.name,
            name: fieldName,
            id: column.position,
            type: 'calendar_date'
          };
          aFilterOps.push(filterOption);
          break;
        default:
          break;
      }
    });

    ReactDOM.render(<FilterContainer
      domain={ datasetMetadata.domain }
      datasetId={ pageMetadata.datasetId }
      filters={ preloadedFilters }
      filterOps={ aFilterOps }
      handleFilterBroadcast={ handleBroadcast } />, document.getElementById('filters'));

    function handleBroadcast(filterObject) {
      $(document).trigger('appliedFilters.qfb.socrata', filterObject);
    }
  }

  document.title = datasetMetadata.name;
  renderCards();

  (function() {
    // Header

    var $navbar = $('.navbar');
    var $logo = $('.navbar-brand img');
    var $navigation = $('.navbar ul.nav');

    var theme = socrataConfig.themeV3;
    var routes = {
      user: [{
        title: 'Sign Out',
        url: '/logout'
      }],
      visitor: [{
        title: 'Sign In',
        url: '/login?referer_redirect=1'
      }, {
        title: 'Sign Up',
        url: '/signup?referer_redirect=1'
      }]
    };

    $navbar.css('background-color', theme.header_background_color);
    $logo.attr('src', theme.logo_url);

    (currentUser ? routes.user : routes.visitor).forEach(function(route) {
      $navigation.append(
        '<li><a href="' + route.url + '">' + route.title + '</a></li>'
      );
    });
  })();

})(window);
