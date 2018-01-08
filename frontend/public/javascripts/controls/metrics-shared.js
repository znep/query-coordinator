/*global Dataset, Highcharts, ServerModel, User, a11y */

(function() {
  var metricsNS = blist.namespace.fetch('blist.metrics');
  blist.namespace.fetch('blist.metrics.transforms');
  var sanitizer = blist.util.htmlSanitizer;

  metricsNS.SERIES_KEY = 'data-series';
  metricsNS.DATA_KEY = 'data-metrics';
  metricsNS.DATE_START = 'data-date-start';
  metricsNS.DATE_END = 'data-date-end';
  metricsNS.TRANSFORM = 'data-transform';
  metricsNS.SHOW_COUNT = 5;

  /*
   * Publicly accessible callback functions for shared analytics
   * functionality between sitewide and dataset-specific data
   *
   */

  // Common render function to take a list of data and make table
  metricsNS.renderTopList = function(data, $target) {
    var table = $target.find('.metricsList');

    table.attr('summary', a11y.tableSummary({
      columns: $.map(table.find('thead th'), function(element) {
        return $(element).text().trim();
      }),
      rows: _.pluck(data, 'linkText'),
      tableDescription: $target.find('.sectionTitle').text()
    }));

    // Clear out the table if we're loading the first set of rows
    if ($target.data('count') <= metricsNS.SHOW_COUNT) {
      table.find('tbody').remove().end();
    }

    if (data.length > 0) {
      table.parent().
      removeClass('noDataAvailable loadingMore').
      end().
      append(
        $.renderTemplate('metricsTopItem', data,
          metricsNS.topListItemDirective)).
      trigger('update').
      trigger('sorton', [
        [
          [1, 1]
        ]
      ]).
      end().fadeIn();
    } else {
      table.parent().addClass('noDataAvailable').fadeIn();
    }
  };

  // Shared data processing function to turn balboa metrics hash, call
  // appropriate transformation then rendering function
  metricsNS.updateTopListWrapper = function($context, data, mapFunction, postProcess) {
    var mapped = [];
    var sorted = $context.data('sorted-data');
    if ($.isBlank(sorted)) {
      // Cache a sorted, arrayified version of the data
      // so we don't generate it every time they click 'Show More'
      sorted = metricsNS.sortData(data);
      $context.data('sorted-data', sorted);
    }

    var count = $context.data('count'),
      newCount = count + metricsNS.SHOW_COUNT,
      dataPart = sorted.slice(count, newCount);

    $context.data('count', newCount);

    _.each(dataPart, function(entry) {
      if (_.isFunction(mapFunction)) {
        mapFunction(entry.item, entry.data, mapped);
      } else {
        mapped.push({
          name: entry.item,
          value: entry.data,
          textValue: Highcharts.numberFormat(entry.data, 0)
        });
      }
    });

    $context.toggleClass('moreDataAvailable', newCount < sorted.length);

    if (_.isFunction(postProcess)) {
      postProcess(mapped, $context);
    } else {
      metricsNS.renderTopList(mapped, $context);
    }
  };
  metricsNS.showMoreClicked = function(section) {
    var $context = $('#' + section.id);
    $context.addClass('loadingMore');
    section.callback($context);
  };

  metricsNS.sortData = function(data) {
    var array = [];
    // Turn associative array (hash) into key/value pair (item, count) array
    for (var key in data) {
      if (!key.startsWith('__') && data.hasOwnProperty(key)) {
        var dataPoint = data[key],
          count = dataPoint;
        if (typeof(dataPoint) !== 'number') {
          count = _.reduce(dataPoint, function(memo, num) {
            return memo + num;
          }, 0);
        }
        array.push({
          item: key,
          count: count,
          data: dataPoint
        });
      }
    }
    // Sort descending
    array.sort(function(a, b) {
      return (b.count || 0) - (a.count || 0);
    });
    return array;
  };

  // This one's pretty easy
  metricsNS.updateTopSearchesCallback = function($context, key) {
    var data = $context.data(metricsNS.DATA_KEY)[key];

    // HACK HACK HACK
    if (data) {
      delete data["''"];
      delete data['null'];
      // strip out four-four search terms
      _.each(_.keys(data), function(dataKey) {
        if (dataKey.match(blist.util.patterns.UID)) {
          delete data[dataKey];
        }
      });
    }

    var searchMap = function(term, count, results) {
      results.push({
        linkText: sanitizer.sanitizeHtmlRestrictive(term), // sanitize to prevent javascript injection attack
        value: count,
        textValue: Highcharts.numberFormat(count, 0),
        href: '/browse?q=' + escape(term)
      });
    };

    metricsNS.updateTopListWrapper($context, data, searchMap);
  };

  // Need to do some extra work here because only UIDs are returned from balboa
  metricsNS.topViewsCallback = function(isIncluded) {
    return function($context) {
      metricsNS.updateTopListWrapper($context,
        $context.data(metricsNS.DATA_KEY),
        function(key, value, results) {
          $.socrataServer.makeRequest({
            url: '/views/' + key + '.json?method=getNoConditional',
            type: 'get',
            batch: true,
            success: function(responseData) {
              // sanitize to prevent javascript injection attack
              if (isIncluded(responseData)) {
                results.push({
                  linkText: sanitizer.sanitizeHtmlRestrictive(responseData.name),
                  value: value,
                  textValue: Highcharts.numberFormat(value, 0),
                  href: createDatasetFromView(responseData).url + (metricsNS.datasetPostfix || '')
                });
              }
            }
          });
        },
        function(data, $mappingContext) {
          var render = function() {
            metricsNS.renderTopList(data, $mappingContext);
          };
          // Some of the batch may have resulted in error, just
          // process what we have
          ServerModel.sendBatch(render, render);
        }
      );
    };
  };

  metricsNS.topStoriesCallback = metricsNS.topViewsCallback(function(responseData) {
    return responseData.viewType == 'story';
  });

  metricsNS.topDatasetsCallback = metricsNS.topViewsCallback(function(responseData) {
    return responseData.viewType == 'tabular' && responseData.displayType != 'data_lens';
  });

  metricsNS.topViewsCallbackNoFilter = metricsNS.topViewsCallback(function() {
    return true;
  });

  // This one's pretty easy
  metricsNS.topQueryStringsCallback = function($context) {
    var data = $context.data(metricsNS.DATA_KEY);
    var searchMap = function(term, count, results) {
      var href = '';
      results.push({
        linkText: sanitizer.sanitizeHtmlRestrictive(term),
        value: count,
        textValue: Highcharts.numberFormat(count, 0),
        href: href
      });
    };
    metricsNS.updateTopListWrapper($context, data, searchMap);
  };

  // Grab the name and info for an app_token, including thumbnail URL (if present)
  metricsNS.topAppTokensCallback = function($context) {
    metricsNS.updateTopListWrapper($context,
      $context.data(metricsNS.DATA_KEY),
      function(key, value, results) {
        if (key === 'anonymous') {
          results.push({
            linkText: 'anonymous application',
            textValue: Highcharts.numberFormat(value, 0),
            value: value
          });
          return;
        }
        $.socrataServer.makeRequest({
          url: '/api/app_tokens/' + key + '.json',
          batch: true,
          type: 'get',
          success: function(responseOrNull) {
            var response = responseOrNull || {};
            var thumbed = response.thumbnailSha,
              klass = thumbed ? 'showThumbnail' : '',
              thumbnail = thumbed ? ('/api/file_data/' + response.thumbnailSha +
                '?size=tiny') : '';

            var owner = new User(response.owner);
            results.push({
              linkText: sanitizer.sanitizeHtmlRestrictive(response.name) || $.t('screens.stats.deleted_application'),
              extraClass: klass,
              href: response.owner ? owner.getProfileUrl() + '/app_tokens/' + response.id : null,
              value: value,
              textValue: Highcharts.numberFormat(value, 0),
              thumbnail: thumbnail
            });
          }
        });
      },
      function(data, $mappingContext) {
        var render = function() {
          metricsNS.renderTopList(data, $mappingContext);
        };
        // Some of the batch may have resulted in error, just
        // process what we have
        ServerModel.sendBatch(render, render);
      }
    );
  };

  // Take the url maps and transform them into usable links with sublinks
  metricsNS.urlMapCallback = function($context) {
    metricsNS.updateTopListWrapper($context,
      $context.data(metricsNS.DATA_KEY),
      function(key, urlHash, results) {
        var totalCount = 0,
          subLinks = [];
        for (var subKey in urlHash) {
          if (urlHash.hasOwnProperty(subKey)) {
            totalCount += urlHash[subKey];
            subLinks.push({
              linkText: sanitizer.sanitizeHtmlRestrictive(subKey),
              href: key + subKey,
              value: urlHash[subKey]
            });
          }
        }
        results.push({
          linkText: sanitizer.sanitizeHtmlRestrictive(key),
          value: totalCount,
          textValue: Highcharts.numberFormat(totalCount, 0),
          href: '#expand',
          linkClass: 'expandTopSection',
          children: _.sortBy(subLinks, function(subItem) {
            return -subItem.value;
          })
        });
      }
    );
  };

  metricsNS.summarySectionCallback = function($context, slice, section) {
    var summaries = $context.data('data-summary'),
      data = $context.data(metricsNS.DATA_KEY),
      mappedData = {},
      summaryCalculator = function(key, append) {
        var overrideKey = _.get(summaries, ['override', key]);
        if (!_.isUndefined(overrideKey)) {
          mappedData[key] = data[overrideKey];
          return;
        }
        var i;
        if (_.isArray(summaries.plus)) {
          mappedData[key] = 0;
          for (i = 0; i < summaries.plus.length; i++) {
            mappedData[key] += (data[summaries.plus[i] + (append || '')] || 0);
          }
        } else {
          mappedData[key] = data[summaries.plus + (append || '')] || 0;
        }
        if (!$.isBlank(summaries.minus)) {
          if (_.isArray(summaries.minus)) {
            for (i = 0; i < summaries.minus.length; i++) {
              mappedData[key] -= (data[summaries.minus[i] + (append || '')] || 0);
            }
          } else {
            mappedData[key] -= (data[summaries.minus + (append || '')] || 0);
          }
        }
      },
      summaryToolTip = function(key, region) {
        if (!$.isBlank(summaries.verbPhrase)) {
          mappedData[key + 'Text'] =
            (mappedData[key] == 0 ? 'No' : Highcharts.numberFormat(mappedData[key], 0)) +
            ' ' + (mappedData[key] == 1 ? summaries.verbPhraseSingular :
              summaries.verbPhrase) + ' ' + region;
        }
      };
    var $timeslice = $context.closest('#analyticsDataContainer').find('.currentTimeSlice');
    var percentCalculator = function(key, fraction) {
      // Note that Highcharts.numberFormat rounds, so only values in [1, 1.5)
      // will be displayed as "1".
      var percent = Math.abs(fraction) * 100;
      if (!_.isFinite(percent)) {
        mappedData[key] = '100%';
      } else if (percent > 0 && percent < 1) {
        mappedData[key] = '< 1%';
      } else {
        mappedData[key] = '{0}%'.format(Highcharts.numberFormat(percent, 0));
      }

      if (fraction === 0 || _.isNaN(fraction)) {
        mappedData[key + 'Class'] = 'hidden';
      } else if (fraction < 0) {
        mappedData[key + 'Class'] = 'minus';
      } else {
        mappedData[key + 'Class'] = 'plus';
      }

      mappedData[key + 'Text'] =
        $.t('screens.stats.delta' +
          (fraction < 0 ? '_decrease' : '_increase') +
          (summaries.total === false ? '_compared' : '')).
      format(
        summaries.deltaPhrase || section.displayName,
        mappedData[key],
        $timeslice.data('range-text') || $timeslice.val(),
        $timeslice.data('range-previousText') || $.t('screens.stats.preceding_period')
      );
    };

    summaryCalculator('total', '-total');
    summaryCalculator('previous', '-previous');
    summaryCalculator('delta');

    summaryToolTip('total', $.t('screens.stats.total'));
    summaryToolTip('delta', $.t('screens.stats.during_time_period'));

    percentCalculator('deltaPercent',
      mappedData.delta / (mappedData.total - mappedData.delta));
    percentCalculator('previousPercent',
      mappedData.delta / mappedData.previous - 1);

    if (!blist.feature_flags['embetter_analytics_page']) {
      if (mappedData.delta < 0) {
        mappedData.delta *= -1;
        mappedData.deltaClass = 'minus';
        mappedData.deltaCharacter = '-';
      } else {
        mappedData.deltaClass = 'plus';
        mappedData.deltaCharacter = '+';
      }
    }

    mappedData.total = Highcharts.numberFormat(mappedData.total, 0);
    mappedData.delta = Highcharts.numberFormat(mappedData.delta, 0);

    var templateName = 'metricsSummaryData';
    var summaryDirective = metricsNS.summaryDataDirective;

    // Omit the delta box if summaries.range = false
    if (!$.isBlank(summaries.range) && !summaries.range) {
      templateName = 'metricsSimpleSummaryData';
      summaryDirective = metricsNS.simpleSummaryDataDirective;
    }

    // Rearrange the layout for V1 improvements
    if (blist.feature_flags['embetter_analytics_page']) {
      templateName = 'metricsSummaryDataV1';
      summaryDirective = metricsNS.summaryDataDirectiveV1;
      mappedData.hiddenClass = 'hidden';

      // Omit the delta if summaries.range = false
      if (summaries.range === false) {
        summaryDirective = metricsNS.simpleSummaryDataDirectiveV1;
      } else if (summaries.total === false) {
        // Show only the delta, compared to a previous delta, if summaries.total = false
        summaryDirective = metricsNS.deltaDataDirective;
      }
    }

    metricsNS.renderSummarySection($context,
      mappedData,
      summaryDirective,
      templateName);
  };

  metricsNS.renderSummarySection = function($context, data, directive, templateName) {
    $context.find('.dynamicContent').empty().append(
      $.renderTemplate(templateName, data, directive)).
    end().fadeIn();
  };

  metricsNS.updateChartCallback = function($chart, sliceType, options) {
    var data = $chart.data(metricsNS.DATA_KEY),
      series = $chart.data(metricsNS.SERIES_KEY),
      start = $chart.data(metricsNS.DATE_START),
      end = $chart.data(metricsNS.DATE_END);

    $chart.parent().loadingSpinner().showHide(false);

    if (!$.isBlank(data) && data.length > 0) {
      $chart.parent().removeClass('noDataAvailable');
      metricsNS.renderMetricsChart(data, $chart,
        start.getTime(), end.getTime(), sliceType, series, options);
    } else {
      _.defer(function() {
        $chart.parent().addClass('noDataAvailable').fadeIn();
      });
    }
  };

  // Removes jagged drops to zero, which are probably the result
  // of data not being recorded for that period
  metricsNS.transforms.smooth = function(data) {
    var lastVal;
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      if (item) {
        lastVal = item;
      } else if (lastVal) {
        data[i] = lastVal;
      }
    }
    return data;
  };

  metricsNS.chartLoading = function($chart) {
    $chart.hide().
    parent().loadingSpinner().showHide(true);
  };

  metricsNS.topListItemDirective = {
    '.item': {
      'topItem <- ': {
        '@class+': 'topItem.extraClass',
        '.thumbnail@src': 'topItem.thumbnail',
        '.titleText': 'topItem.name',
        '.titleLink .titleText': 'topItem.linkText',
        '.titleLink@href': 'topItem.href',
        '.titleLink@class+': 'topItem.linkClass',
        '.value .primaryValue': 'topItem.value',
        '.value .primary': 'topItem.textValue',
        '.subLinks': {
          'subItem <- topItem.children': {
            '.subLink': 'subItem.linkText',
            '.subLink@href': 'subItem.href'
          }
        },
        '.subValues': {
          'subItem <- topItem.children': {
            '.subValue': 'subItem.value'
          }
        }
      }
    }
  };

  metricsNS.summaryDataDirective = {
    '.deltaValue': 'delta',
    '.deltaValue@aria-label': 'deltaText',
    '.deltaBox@title': 'deltaText',
    '.deltaBox@aria-label': 'deltaText',
    '.deltaBox@class+': function(v) {
      if (_.isString(v.context.delta) && v.context.delta != '0') {
        return v.context.deltaClass;
      } else {
        return 'hide';
      }
    },
    '.totalValue': 'total',
    '.totalValue@title': 'totalText',
    '.deltaCharacter': 'deltaCharacter'
  };

  metricsNS.summaryDataDirectiveV1 = {
    '.deltaValue': 'delta',
    '.deltaValue@title': 'deltaText',
    '.percentValue': 'deltaPercent',
    '.percentBox@title': 'deltaPercentText',
    '.percentBox@class+': 'deltaPercentClass',
    '.totalValueV1': 'total',
    '.totalWrapper@title': 'totalText'
  };

  metricsNS.simpleSummaryDataDirective = {
    '.totalValue': 'total',
    '.totalValue@title': 'totalText'
  };

  metricsNS.simpleSummaryDataDirectiveV1 = {
    '.deltaValue': 'total',
    '.percentBox@class+': 'hiddenClass',
    '.totalValueWrapper@class+': 'hiddenClass'
  };

  metricsNS.deltaDataDirective = {
    '.deltaValue': 'delta',
    '.deltaValue@title': 'deltaText',
    '.percentValue': 'previousPercent',
    '.percentBox@title': 'previousPercentText',
    '.percentBox@class+': 'previousPercentClass',
    '.totalWrapper@class+': 'hiddenClass'
  };

})();
