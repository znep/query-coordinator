/* global pageMetadata, datasetMetadata */

/* Dependencies */
import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import moment from 'moment';

/* Components */
require('./components/headerSetup');
require('./components/metaContainerSetup');
import FilterContainer from './react-components/qfb/filtercontainer/FilterContainer';
import PageContainer from './react-components/pageContainer/pageContainer';
import Visualizations from 'socrata-visualizations';

import 'leaflet/dist/leaflet.css';
import 'socrata-visualizations/dist/socrata-visualizations.css';

(function() {
  'use strict';

  const LARGE_DATASET_ROW_COUNT = 100000;
  const LARGE_DATASET_COLUMN_COUNT = 50;

  var soqlDataProvider = new Visualizations.dataProviders.SoqlDataProvider({
    datasetUid: datasetMetadata.id,
    domain: datasetMetadata.domain
  });

  function renderCards() {
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

    // Process search cards only
    var searchCardsOnly = _.filter(pageMetadata.cards, { cardType: 'search' });
    _.each(searchCardsOnly, function(card) {
      if (!_.find(aPredefinedFilters, { name: card.fieldName })) {
        var filterObj = {
          id: card.fieldName,
          type: 'string',
          name: card.fieldName,
          displayName: _.get(datasetMetadata.columns[card.fieldName], 'name'),
          data: null,
          startWithClosedFlannel: true
        };
        aPredefinedFilters.push(filterObj);
      }
    });

    // Exclude search cards from the rest
    var _rawCardsExceptSearch = _.reject(pageMetadata.cards, { cardType: 'search' });

    ReactDOM.render(<PageContainer
      cards={ _rawCardsExceptSearch }
      filters={ vifFilters }/>, document.getElementById('mobile-components'));

    setupQfb(aPredefinedFilters);
  }

  /**
   * Sets up QFB bar with fields from cards
   * @param preloadedFilters
   */
  function setupQfb(preloadedFilters) {
    var filterDataObservable = document.createDocumentFragment();
    var _latestFilterObject;

    _attachModalEvents();
    _determineDatasetSize().
      then(_generateFilterOptions).
      then(_renderFilterContainer);

    $('#btn-close, #btn-proceed').on('click', function() {
      $(document).trigger('appliedFilters.qfb.socrata', _latestFilterObject);
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
          _latestFilterObject = filterObject;

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
        var MAX_LEGAL_JAVASCRIPT_DATE_STRING = '9999-01-01';
        var SOQL_DATA_PROVIDER_NAME_ALIAS = '__NAME_ALIAS__';
        var SOQL_DATA_PROVIDER_VALUE_ALIAS = '__VALUE_ALIAS__';
        var DATA_QUERY_PREFIX = 'SELECT {4}(`{0}`) AS {1}, {2} AS {3}';
        var DATA_QUERY_SUFFIX = 'GROUP BY {0}';
        var DATA_QUERY_WHERE_CLAUSE_PREFIX = 'WHERE';
        var DATA_QUERY_WHERE_CLAUSE_SUFFIX = "`{0}` IS NOT NULL AND `{0}` < '{1}' AND (1=1)";

        var fieldName = _.findKey(datasetMetadata.columns, { position: column.position });

        return new Promise(function(resolve) {
          __queryLimits(fieldName).then(function(promiseArguments) {

            var data = promiseArguments[0];
            var precision = mapQueryResponseToPrecision(data);
            var dataQueryString = mapPrecisionToDataQuery(precision);

            var unfilteredWhereClause = '{0} {1}'.format(
              DATA_QUERY_WHERE_CLAUSE_PREFIX,
              DATA_QUERY_WHERE_CLAUSE_SUFFIX.format(fieldName, MAX_LEGAL_JAVASCRIPT_DATE_STRING)
            );

            var unfilteredSoqlQuery = soqlDataProvider.query(
              dataQueryString.format(unfilteredWhereClause),
              SOQL_DATA_PROVIDER_NAME_ALIAS,
              SOQL_DATA_PROVIDER_VALUE_ALIAS
            );

            unfilteredSoqlQuery.then(function(response) {
              var thisDate;
              var allLabels = [];

              _.each(response.rows, function(value, i) {
                if (i === 0) {
                  return;
                }
                thisDate = new Date((_.isNull(value[0]) || _.isUndefined(value[0])) ? '' : value[0]);

                switch (precision) {
                  case 'DECADE':
                    if (thisDate.getFullYear() % 10 === 0) {
                      allLabels.push(thisDate);
                    }
                    break;
                  case 'YEAR':
                    allLabels.push(thisDate.setMonth(0));
                    break;
                  case 'MONTH':
                    allLabels.push(thisDate.setDate(1));
                    break;
                  case 'DAY':
                    allLabels.push(thisDate);
                    break;
                }
              });

              allLabels = _(allLabels).
                uniq().
                map((label) => { return new Date(label); }).
                sortBy().
                value();

              resolve({
                filterName: column.name,
                name: _.findKey(datasetMetadata.columns, { position: column.position }),
                id: column.position,
                type: 'calendar_date',
                scale: allLabels
              });

            });
          });
        });

        function mapQueryResponseToPrecision(data) {
          var domainStartDate = data.rows[0][0];
          var domainEndDate = data.rows[0][1];

          var domain = {
            start: moment(domainStartDate, moment.ISO_8601),
            end: moment(domainEndDate, moment.ISO_8601)
          };

          if (!domain.start.isValid()) {
            domain.start = null;
            console.warn('Invalid start date on {0} ({1})'.format(fieldName, domainStartDate));
          }

          if (!domain.end.isValid()) {
            domain.end = null;
            console.warn('Invalid end date on {0} ({1})'.format(fieldName, domainEndDate));
          }

          // Return undefined if the domain is undefined, null, or malformed
          // in some way.  Later on, we will test if datasetPrecision is
          // undefined and display the proper error message.
          // By examining the return of getTimelineDomain, these are the
          // only checks we need.
          if (_.isUndefined(domain) || _.isNull(domain.start) || _.isNull(domain.end)) {
            throw 'Timeline Domain is invalid: {0}'.format(domain);
          }

          var precision;

          // Otherwise, return the precision as a string.
          // Moment objects are inherently mutable. Therefore, the .add()
          // call in the first condition will need to be accounted for in
          // the second condition. We're doing this instead of just cloning
          // the objects because moment.clone is surprisingly slow (something
          // like 40ms).
          if (domain.start.add('years', 1).isAfter(domain.end)) {
            precision = 'DAY';
            // We're actually checking for 20 years but have already added one
            // to the original domain start date in the if block above.
          } else if (domain.start.add('years', 19).isAfter(domain.end)) {
            precision = 'MONTH';
          } else {
            precision = 'YEAR';
          }

          return precision;
        }

        function mapPrecisionToDataQuery(precision) {
          var dateTruncFunction;
          var card = _.find(pageMetadata.cards, { fieldName: fieldName });
          var tempVif = {
            aggregation: {
              'function': _.get(card, 'aggregationFunction'),
              'field': _.get(card, 'aggregationField')
            }
          };
          var aggregationClause = Visualizations.dataProviders.SoqlHelpers.aggregationClause(tempVif);

          switch (precision) {
            case 'YEAR':
              dateTruncFunction = 'date_trunc_y';
              break;
            case 'MONTH':
              dateTruncFunction = 'date_trunc_ym';
              break;
            case 'DAY':
              dateTruncFunction = 'date_trunc_ymd';
              break;
            default:
              throw 'precision was invalid: {0}'.format(precision);
          }

          return (
            DATA_QUERY_PREFIX.format(
              fieldName,
              SOQL_DATA_PROVIDER_NAME_ALIAS,
              aggregationClause,
              SOQL_DATA_PROVIDER_VALUE_ALIAS,
              dateTruncFunction
            ) +
            ' {0} ' +
            DATA_QUERY_SUFFIX.format(SOQL_DATA_PROVIDER_NAME_ALIAS)
          );
        }
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
      var filterOps = _.sortBy(filterOptions, function(o) {
        return o.filterName;
      });

      ReactDOM.render(<FilterContainer
        domain={ datasetMetadata.domain }
        datasetId={ pageMetadata.datasetId }
        filters={ preloadedFilters }
        filterOps={ filterOps }
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

  $('.dl-name').html(pageMetadata.name);
  document.title = pageMetadata.name;
  renderCards();
})(window);
