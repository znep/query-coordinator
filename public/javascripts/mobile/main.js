/* global pageMetadata, datasetMetadata, socrataConfig */

/* Dependencies */
import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import moment from 'moment';

/* QFB components */
import FilterContainer from './react-components/qfb/filtercontainer/FilterContainer';

/* Visualizations components */
var mobileColumnChart = require('./mobile.columnchart.js');
var mobileTimelineChart = require('./mobile.timelinechart.js');
var mobileFeatureMap = require('./mobile.featuremap.js');
var mobileChoroplethMap = require('./mobile.choroplethmap.js');
var mobileTable = require('./mobile.table.js');
var mobileDistributionChart = require('./mobile.distribution-chart.js');

import Visualizations from 'socrata-visualizations';

import 'leaflet/dist/leaflet.css';
import 'socrata-visualizations/dist/socrata-visualizations.css';
import './styles/mobile-general.scss';

(function() {
  'use strict';

  var $dlName = $('.dl-name');
  $dlName.html(datasetMetadata.name);

  const TABLE_UNSORTABLE_PHYSICAL_DATATYPES = ['geo_entity', 'point'];
  const LARGE_DATASET_ROW_COUNT = 100000;
  const LARGE_DATASET_COLUMN_COUNT = 50;

  var firstCard = _.sortBy(
    _.filter(datasetMetadata.columns, function(column) {
      return TABLE_UNSORTABLE_PHYSICAL_DATATYPES.indexOf(column.physicalDatatype) < 0;
    }), 'position')[0];

  var soqlDataProvider = new Visualizations.dataProviders.SoqlDataProvider({
    datasetUid: datasetMetadata.id,
    domain: datasetMetadata.domain
  });

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

      if ((stp + 20) > lastScrollTop && stp > 0) {
        if (!wasScrollingDown) {
          wasScrollingDown = true;

          $navbar.removeClass('navbar-visible').addClass('navbar-hidden');
          $('#navbar').removeClass('in').attr('aria-expanded','false');
        }
      } else {
        if (wasScrollingDown) {
          wasScrollingDown = false;

          $navbar.removeClass('navbar-hidden').addClass('navbar-visible');
        }
      }

      lastScrollTop = stp;
    });
  }

  function renderCards() {
    var $cardContainer;
    var values;
    var aPredefinedFilters = [];
    var vifFilters = [];

    /**
     * Converts dataTypes to QFB format
     * @param {string} dataTypeName
     * @returns {string}
     * @private
     */
    function _convertFilterType2QFB(dataTypeName) {
      switch (dataTypeName) {
        case 'number':
          return 'int';
        case 'calendar_date':
          return 'calendar_date';
        case 'text':
        default:
          return 'string';
      }
    }

    /**
     * Convert arguments with date ranges to QFB format
     * @param {object} args
     * @returns {object}
     * @private
     */
    function _convertToQFBDate(args) {
      var out = {};

      if (args.start && args.end) {
        out.dir = 'bt';
        out.val1 = args.start.format('YYYY-MM-DD');
        out.val2 = args.end.format('YYYY-MM-DD');
      } else if (args.start) {
        out.dir = 'lt';
        out.val1 = args.start.format('YYYY-MM-DD');
      } else {
        out.dir = 'gt';
        out.val2 = args.end.format('YYYY-MM-DD');
      }

      return out;
    }

    /**
     * Convert arguments with numbers to QFB format
     * @param {object} args
     * @returns {object}
     * @private
     */
    function _convertToQFBNumber(args) {

      if (args.start && args.end) {
        return { dir: 'bt', val1: args.start, val2: args.end };
      } else if (args.start) {
        return { dir: 'gt', val1: args.start };
      } else if (args.end) {
        return { dir: 'lt', val2: args.end };
      }

    }

    /**
     * Converts first char of the given string to lower case
     * @param {string} str
     * @returns {string}
     * @private
     */
    function _convertLowerFirstChar(str) {
      return str.charAt(0).toLowerCase() + str.slice(1);
    }

    /**
     * Add filter to VIF filters collection
     * @param {string} fieldName
     * @param {object} args
     * @param {string} _function
     * @private
     */
    function _addToVIFFilters(fieldName, args, _function) {
      vifFilters.push({
        'columnName': fieldName,
        'arguments': args,
        'function': _convertLowerFirstChar(_function)
      });
    }

    /**
     * Add filter to QFB filters collection
     * @param {string} displayName
     * @param {string} dataTypeName
     * @param {string} fieldName
     * @param {object} args
     * @private
     */
    function _addToQFBFilters(displayName, dataTypeName, fieldName, args) {
      aPredefinedFilters.push({
        id: fieldName,
        type: _convertFilterType2QFB(dataTypeName),
        name: fieldName,
        displayName: displayName,
        data: args,
        startWithClosedFlannel: true
      });
    }

    // Go through all the cards and collect cards with filters
    var sameColumnCards = {};
    _.each(pageMetadata.cards, function(card) {

      // Finding cards with same columns which has active filters
      if (!sameColumnCards[card.fieldName]) {
        sameColumnCards[card.fieldName] = _.filter(pageMetadata.cards, function(_card) {
          return _card.fieldName == card.fieldName && _card.activeFilters && _card.activeFilters.length > 0;
        });
      }

    });

    // Filter out undefined cards
    sameColumnCards = _.filter(sameColumnCards, function(_column) {
      return _.filter(_column, function(card) {
          return card != undefined;
        }).length > 0;
    });

    _.each(sameColumnCards, function(cards) {
      var thisSetFirstCard = cards[0];
      var columnMeta = datasetMetadata.columns[thisSetFirstCard.fieldName];

      switch (thisSetFirstCard.activeFilters[0]['function']) {
        case 'TimeRange':
          var args = {};

          _.each(cards, function(card) {
            _.each(card.activeFilters, function(filter) {

              if (filter['arguments'].start) { // eslint-disable-line dot-notation
                var _start = moment(filter['arguments'].start); // eslint-disable-line dot-notation

                if (!args.start || args.start < _start) {
                  args.start = _start;
                }

                filter['arguments'].start = moment(filter['arguments'].start).format('YYYY-MM-DD'); // eslint-disable-line dot-notation
              }

              if (filter['arguments'].end) { // eslint-disable-line dot-notation
                var _end = moment(filter['arguments'].end); // eslint-disable-line dot-notation

                if (!args.end || args.end > _end) {
                  args.end = _end;
                }

                filter['arguments'].end = moment(filter['arguments'].end).format('YYYY-MM-DD'); // eslint-disable-line dot-notation
              }

              _addToVIFFilters(thisSetFirstCard.fieldName, filter['arguments'], filter['function']);// eslint-disable-line dot-notation
            });
          });

          _addToQFBFilters(_.get(columnMeta, 'name'),
            columnMeta.dataTypeName, thisSetFirstCard.fieldName, _convertToQFBDate(args));
          break;

        case 'BinaryOperator':
          if ( columnMeta.dataTypeName == 'text') {
            var valueList = [];

            _.each(cards, function(card) {
              _.each(card.activeFilters, function(filter) {
                if (!_.find(valueList, { text: filter['arguments'].operand })) { // eslint-disable-line dot-notation
                  valueList.push({ text: filter['arguments'].operand }); // eslint-disable-line dot-notation
                }

                _addToVIFFilters(thisSetFirstCard.fieldName, filter['arguments'], filter['function']);// eslint-disable-line dot-notation
              });
            });

            _addToQFBFilters(_.get(columnMeta, 'name'),
              columnMeta.dataTypeName, thisSetFirstCard.fieldName, valueList);
          } else if (columnMeta.dataTypeName == 'number') {
            var _args = {};

            _.each(cards, function(card) {
              _.each(card.activeFilters, function(filter) {

                switch (filter['arguments'].operator) { // eslint-disable-line dot-notation
                  case '=':
                    if (!_.find(vifFilters, { 'function': 'binaryOperator', columnName: thisSetFirstCard.fieldName, arguments: { operator: '='}})) {
                      _args.start = _args.end = filter['arguments'].operand; // eslint-disable-line dot-notation

                      _addToVIFFilters(thisSetFirstCard.fieldName, filter['arguments'], filter['function']);// eslint-disable-line dot-notation
                    }

                    break;
                  case '>=':
                    if (!_args.start || _args.start < filter['arguments'].operand) { // eslint-disable-line dot-notation
                      _args.start = filter['arguments'].operand; // eslint-disable-line dot-notation
                    }

                    _addToVIFFilters(thisSetFirstCard.fieldName, filter['arguments'], filter['function']);// eslint-disable-line dot-notation
                    break;
                  case '<':
                    if (!_args.end || _args.end > filter['arguments'].operand) { // eslint-disable-line dot-notation
                      _args.end = filter['arguments'].operand; // eslint-disable-line dot-notation
                    }

                    _addToVIFFilters(thisSetFirstCard.fieldName, filter['arguments'], filter['function']);// eslint-disable-line dot-notation
                    break;
                }

              });
            });

            _addToQFBFilters(_.get(columnMeta, 'name'),
              columnMeta.dataTypeName, thisSetFirstCard.fieldName, _convertToQFBNumber(_args));
          }
          break;
      }

    });

    var _cardsWithTables = _.filter(pageMetadata.cards, { cardType: 'table' });
    var _cardsExpanded = _.filter(pageMetadata.cards, { expanded: true });
    var _cardsOther = _.reject(pageMetadata.cards, function(card) {
      return card.cardType == 'table' || card.expanded;
    });
    var allCardsWithOrder = _cardsExpanded.concat(_cardsOther).concat(_cardsWithTables);
    var unit = {
      one: _.get(datasetMetadata, 'rowDisplayUnit', 'row'),
      other: socrata.utils.pluralize(_.get(datasetMetadata, 'rowDisplayUnit', 'row'), 2)
    };

    _.each(allCardsWithOrder, function(card) {
      var cardOptions = {
        componentClass: '',
        metaData: datasetMetadata.columns[card.fieldName],
        containerClass: ''
      };

      switch (card.cardType) {
        case 'search':
          var position = _.get(cardOptions, 'metadata.position', '-1').toString();

          if (!_.find(aPredefinedFilters, { name: card.fieldName })) {
            var filterObj = {
              id: card.fieldName,
              type: 'string',
              name: card.fieldName,
              displayName: _.get(cardOptions, 'metaData.name'),
              data: null,
              startWithClosedFlannel: true
            };
            aPredefinedFilters.push(filterObj);
          }
          break;
        case 'timeline':
          cardOptions.componentClass = 'timeline-chart-upper-wrapper';
          cardOptions.containerClass = 'timeline-chart-upper-container';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName,
            unitLabel: datasetMetadata.columns[(card.aggregationField || card.fieldName)].name,
            aggregationFunction: card.aggregationFunction,
            aggregationField: card.aggregationField,
            filters: vifFilters,
            unit: unit
          };

          mobileTimelineChart(values, $cardContainer.find('.' + cardOptions.componentClass));
          break;
        case 'feature':
          cardOptions.componentClass = 'feature-map-wrapper';
          cardOptions.containerClass = 'map-container';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName,
            aggregationFunction: card.aggregationFunction,
            aggregationField: card.aggregationField,
            filters: vifFilters,
            unit: unit
          };

          mobileFeatureMap(values, $($cardContainer.find('.' + cardOptions.componentClass)));
          break;
        case 'choropleth':
          cardOptions.containerClass = 'choropleth-upper-container';
          cardOptions.componentClass = 'choropleth-upper-wrapper';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName,
            computedColumnName: card.computedColumn,
            geojsonUid: datasetMetadata.columns[card.computedColumn].computationStrategy.parameters.region.substring(1),
            mapExtent: (card.cardOptions) ? card.cardOptions.mapExtent || {} : {},
            aggregationFunction: card.aggregationFunction,
            aggregationField: card.aggregationField,
            filters: vifFilters,
            unit: unit
          };

          mobileChoroplethMap(values, $cardContainer.find('.' + cardOptions.componentClass));
          break;
        case 'column':
          cardOptions.containerClass = 'column-chart-upper-container';
          cardOptions.componentClass = 'column-chart-upper-wrapper';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName,
            aggregationFunction: card.aggregationFunction,
            aggregationField: card.aggregationField,
            filters: vifFilters,
            unit: unit
          };

          mobileColumnChart(values, $cardContainer.find('.' + cardOptions.componentClass));
          break;
        case 'table':
          cardOptions.id = 'table';
          cardOptions.componentClass = 'socrata-table-container';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName,
            orderColumnName: _.findKey(datasetMetadata.columns, firstCard),
            aggregationFunction: card.aggregationFunction,
            aggregationField: card.aggregationField,
            filters: vifFilters,
            unit: unit
          };

          mobileTable(values, $cardContainer.find('.' + cardOptions.componentClass));
          break;
        case 'histogram':
          cardOptions.componentClass = 'distribution-chart-upper-wrapper';
          cardOptions.containerClass = 'distribution-chart-upper-container';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: datasetMetadata.domain,
            datasetUid: datasetMetadata.id,
            columnName: card.fieldName,
            orderColumnName: _.findKey(datasetMetadata.columns, firstCard),
            aggregationFunction: card.aggregationFunction,
            aggregationField: card.aggregationField,
            filters: vifFilters,
            unit: unit
          };

          mobileDistributionChart(values, $($cardContainer.find('.' + cardOptions.componentClass)));
          break;
        default:
          break;
      }
    });

    $('.meta-container').before(getPageTemplate());
    mobileCardViewer();
    setupQfb(aPredefinedFilters);
  }

  /**
   * Sets up QFB bar with fields from cards
   * @param preloadedFilters
   */
  function setupQfb(preloadedFilters) {
    var filterDataObservable = document.createDocumentFragment();

    _attachModalEvents();
    _determineDatasetSize().
      then(_generateFilterOptions).
      then(_renderFilterContainer);

    $('#btn-close, #btn-proceed').on('click', function() {
      $('#modal-container').addClass('hidden');
    });

    $('#btn-clear-filters').on('click', function() {
      filterDataObservable.dispatchEvent(new Event('clearFilters.qfb.socrata'));
      $('#modal-container').addClass('hidden');
    });

    function _handleBroadcast(filterObject) {
      var whereClauseComponents = Visualizations.dataProviders.SoqlHelpers.whereClauseFilteringOwnColumn({
        filters: filterObject.filters,
        type: 'table'
      });

      soqlDataProvider.getRowCount(whereClauseComponents).then(function(data) {
        if (parseInt(data, 10) > 0) {
          $(document).trigger('appliedFilters.qfb.socrata', filterObject);
        } else {
          $('#modal-container').removeClass('hidden').on('click', function() {
            $(this).addClass('hidden');
          });
        }
      });
    }

    function _attachModalEvents() {
      $('.warning-modal').on('click', function(e) {
        e.stopPropagation();
      });

      $('#btn-close, #btn-proceed').on('click', function() {
        $('#modal-container').addClass('hidden');
      });

      $('#btn-clear-filters').on('click', function() {
        filterDataObservable.dispatchEvent(new Event('clearFilters.qfb.socrata'));
        $('#modal-container').addClass('hidden');
      });
    }

    function _generateFilterOptions(isLargeDataset) {
      return new Promise(function(resolve) {
        // TODO: rewrite this with _.pickBy when we update to lodash 4 so we can preserve object keys.
        var columns = isLargeDataset ?
          _.filter(datasetMetadata.columns, function(column, fieldName) {
            return _.find(pageMetadata.cards, { fieldName: fieldName });
          }) : datasetMetadata.columns;

        var filterOptionsPromises = [];
        _.each(columns, function(column) {
          switch (column.dataTypeName) {
            case 'text':
              filterOptionsPromises.push(__textTypeFilter(column));
              break;
            case 'number':
              filterOptionsPromises.push(__numberTypeFilter(column, isLargeDataset));
              break;
            case 'calendar_date':
              filterOptionsPromises.push(__dateTypeFilter(column));
              break;
            default:
              break;
          }
        });

        Promise.
          all(filterOptionsPromises).
          then(resolve)
          ['catch'](function(error) {
            console.error(error);
          });
      });

      function __textTypeFilter(column) {
        return new Promise(function(resolve) {
          resolve({
            filterName: column.name,
            name: _.findKey(datasetMetadata.columns, { position: column.position }),
            id: column.position,
            type: 'string'
          });
        });
      }

      function __numberTypeFilter(column, isLargeData) {
        return new Promise(function(resolve) {
          var fieldName = _.findKey(datasetMetadata.columns, { position: column.position });

          __queryLimits(fieldName).
            then(__getBuckets).
            then(function(buckets) {
              var scaleArray = _.map(buckets, function(el) {
                return el.start;
              });

              scaleArray.push(_.last(buckets).end);

              resolve({
                filterName: column.name,
                name: fieldName,
                id: column.position,
                type: 'int',
                scale: scaleArray,
                largeDataset: isLargeData
              });
            });
        });
      }

      function __dateTypeFilter(column) {
        return new Promise(function(resolve) {
          var fieldName = _.findKey(datasetMetadata.columns, { position: column.position });

          __queryLimits(fieldName).then(function(promiseArguments) {
            var data = promiseArguments[0];

            data = _.map(data, function(val) {
              return new Date(String(val));
            });

            var scale = d3.time.scale().domain(data).ticks(20);

            resolve({
              filterName: column.name,
              name: _.findKey(datasetMetadata.columns, { position: column.position }),
              id: column.position,
              type: 'calendar_date',
              scale: scale
            });
          });
        });
      }

      function __queryLimits(fieldName) {
        return new Promise(function(resolve) {
          var columnNames = [ 'min', 'max' ];
          var query = '$query=SELECT min({column}) as `min`, max({column}) as `max`'.format({
            column: fieldName
          });

          soqlDataProvider.getRows(columnNames, query).then(function(data) {
            resolve([data, fieldName]);
          });
        });
      }

      function __getBuckets(promiseArguments) {
        var data = _.map(_.first(promiseArguments[0].rows), parseFloat);
        var fieldName = promiseArguments[1];
        var bucketingOptions = {};
        var absMax = Math.max(Math.abs(data[0]), Math.abs(data[1]));
        var threshold = 2000;

        bucketingOptions.bucketType = (absMax >= threshold) ? 'logarithmic' : 'linear';

        if (bucketingOptions.bucketType === 'linear') {
          var buckets = d3.scale.linear().nice().domain(data).ticks(20);

          if (buckets.length >= 2) {
            bucketingOptions.bucketSize = buckets[1] - buckets[0];
          } else {
            bucketingOptions.bucketSize = 1;
          }
        }

        var bucketingFunction;
        var bucketingArguments;

        if (bucketingOptions.bucketType === 'linear') {
          bucketingFunction = 'signed_magnitude_linear';
          bucketingArguments = [ bucketingOptions.bucketSize ];
        } else {
          bucketingFunction = 'signed_magnitude_10';
          bucketingArguments = [];
        }

        var aggregationClause;
        var card = _.find(pageMetadata.cards, {fieldName: fieldName});
        if (card) {
          aggregationClause = Visualizations.dataProviders.SoqlHelpers.aggregationClause({
            aggregation: {
              'function': card.aggregationFunction,
              field: card.aggregationField
            }
          });
        } else {
          aggregationClause = Visualizations.dataProviders.SoqlHelpers.aggregationClause({
            aggregation: { 'function': '', field: '' }
          });
        }

        var queryParameters = {
          bucketingFunction: bucketingFunction,
          bucketingArguments: [''].concat(bucketingArguments).join(', '),
          column: fieldName,
          columnAlias: '__magnitude__',
          value: aggregationClause,
          valueAlias: '__value__',
          whereClause: ''
        };

        var queryTemplate = [
          'select {bucketingFunction}({column}{bucketingArguments}) as {columnAlias}, ',
          '{value} as {valueAlias} ',
          '{whereClause} group by {columnAlias} order by {columnAlias} limit 200'
        ].join('');

        return new Promise(function(resolve) {
          soqlDataProvider.query(queryTemplate.format(queryParameters), queryParameters.columnAlias,
            queryParameters.valueAlias).
            then(function(unfilteredResponse) {
              var requestData = _.mapValues({'unfiltered': unfilteredResponse}, function(response) {
                return _.chain(response.rows).map(function(pair) {
                  return _.map(pair, parseFloat);
                }).map(_.partial(_.zipObject, ['magnitude', 'value'])).value();
              });

              resolve(Visualizations.views.DistributionChartHelpers.bucketData(requestData.unfiltered,
                bucketingOptions));
            });
        });
      }
    }

    function _renderFilterContainer(filterOptions) {
      ReactDOM.render(<FilterContainer
        domain={ datasetMetadata.domain }
        datasetId={ pageMetadata.datasetId }
        filters={ preloadedFilters }
        filterOps={ filterOptions }
        filterDataObservable={ filterDataObservable }
        handleFilterBroadcast={ _handleBroadcast } />, document.getElementById('filters'));
    }

    function _determineDatasetSize() {
      return new Promise(function(resolve) {
        soqlDataProvider.getRowCount().then(function(data) {
          resolve(parseInt(data, 10) > LARGE_DATASET_ROW_COUNT ||
            Object.keys(datasetMetadata.columns).length > LARGE_DATASET_COLUMN_COUNT);
        });
      });
    }
  }

  document.title = datasetMetadata.name;
  renderCards();

  (function() {
    // Header

    var $navbar = $('.navbar');
    var $logo = $('.navbar-brand img');
    var $navigation = $('.navbar ul.nav');

    var theme = socrataConfig.themeV3 || {};
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

    $navbar.css('background-color', theme.header_background_color || 'white');
    $logo.attr('src', theme.logo_url);

    (currentUser ? routes.user : routes.visitor).forEach(function(route) {
      $navigation.append(
        '<li><a href="' + route.url + '">' + route.title + '</a></li>'
      );
    });
  })();

})(window);
