/* global pageMetadata, datasetMetadata, socrataConfig */

/*
* QFB components
*/
var mobileColumnChart = require('./mobile.columnchart.js');
var mobileTimelineChart = require('./mobile.timelinechart.js');
var mobileFeatureMap = require('./mobile.featuremap.js');
var mobileChoroplethMap = require('./mobile.choroplethmap.js');
var mobileTable = require('./mobile.table.js');

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
            '<p class="padding">',
              '<span class="dl-description">' + datasetMetadata.description + '</span>',
              '<span class="text-link">Collapse details</span>',
            '</p>',
          '</div>'
        ].join('')
      );
    } else {
      return $(
        [
          '<p class="intro padding">',
            '<span class="dl-description">' + datasetMetadata.description + '</span>',
          '</p>'
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

  function mobileCardViewer() {

    var $intro = $('.intro');
    var $all = $('.all');
    var $metadataContent = $('#metadata-content');

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

    $('#button-toggle-metadata').on('click', function() {
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

    $('.meta-go-link').on('click', function() {
      var url = window.location.href;
      var aUrlParts = url.split('/mobile');
      window.location = aUrlParts[0];
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
          cardOptions.componentClass = 'socrata-table';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName
          };

          mobileTable(values, $cardContainer.find('.' + cardOptions.componentClass));
          break;
        default:
          break;
      }
    });

    $('.meta-container').before(getPageTemplate());
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
