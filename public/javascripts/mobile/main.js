/* global pageMetadata, datasetMetadata */

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

  function getTemplate(options) {
    return $(
      [
        '<div class="component-container ' + options.containerClass + '">',
        '<article class="intro-text">',
        '<h5>' + options.metaData.name + '</h5>',
        '<p class="intro padding hidden">',
        '<span class="desc"></span>',
        '<span class="text-link">more</span>',
        '</p>',
        '<div class="all hidden">',
        '<p class="padding">',
        '<span class="desc">' + options.metaData.description + '</span>',
        '<span class="text-link">less</span>',
        '</p>',
        '</div>',
        '</article>',
        '<div id="' + options.id + '"></div>',
        '</div>'
      ].join('')
    );
  }

  function mobileCardViewer() {
    var $intro = $('.intro');
    var $all = $('.all');
    var description = $('.all').find('.desc').html();
    var introText = description.substring(0, 85);

    $intro.find('.desc').html(introText);
    $intro.removeClass('hidden');

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

  function renderCards() {
    var $cardContainer;
    var values;

    $.each(pageMetadata.cards, function(i, card) {
      var cardOptions = {
        id: '',
        metaData: datasetMetadata.columns[card.fieldName],
        containerClass: ''
      };

      switch (card.cardType) {
        case 'timeline':
          cardOptions.id = 'timeline-chart';
          cardOptions.containerClass = 'timeline-chart-container';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName
          };

          mobileTimelineChart(values, $cardContainer.find('#timeline-chart'));
          break;
        case 'feature':
          cardOptions.id = 'feature-map';
          cardOptions.containerClass = 'map-container';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName
          };

          mobileFeatureMap(values, $cardContainer.find('#feature-map'));
          break;
        case 'choropleth':
          cardOptions.id = 'choropleth';
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

          mobileChoroplethMap(values, $cardContainer.find('#choropleth'));
          break;
        case 'column':
          cardOptions.id = 'column-chart';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName
          };

          mobileColumnChart(values, $cardContainer.find('#column-chart'));
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

    mobileCardViewer();
    setupQfb();
  }

  function setupQfb() {

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
      filterOps={ aFilterOps }
      handleFilterBroadcast={ handleBroadcast } />, document.getElementById('filters'));

    function handleBroadcast(filterObject) {
      $(document).trigger('appliedFilters.qfb.socrata', filterObject);
    }
  }

  document.title = datasetMetadata.name;
  renderCards();

})(window);
