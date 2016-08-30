blist.namespace.fetch('blist.metrics');

$(function() {
  // Shared between tabular and non-tabular
  var querySummary = {
    id: 'summaryQueries',
    displayName: 'Queries Served',
    summary: {
      plus: 'queries',
      verbPhrase: 'queries served',
      verbPhraseSingular: 'query served'
    }
  };

  var charts, summaries, details;
  charts = [{
    id: 'performanceChart',
    loading: blist.metrics.chartLoading,
    children: [{
      text: 'Queries Served',
      series: [{
        method: 'queries-served'
      }]
    }, {
      text: 'Bytes Served',
      series: [{
        method: 'bytes-out'
      }]
    }, {
      text: 'Rows Served',
      series: [{
        method: 'rows-loaded-api'
      }]
    }]
  }];
  summaries = [
    querySummary
  ];
  details = [];

  var screen = $('#analyticsDataContainer').metricsScreen($.extend({
    urlBase: '/api/views/' + blist.metrics.viewID + '/metrics.json',
    chartSections: charts,
    detailSections: details,
    summarySections: summaries,
    topListSections: [{
      id: 'topApps',
      displayName: 'Top Applications',
      heading: 'Queries',
      className: 'expanding',
      renderTo: 'leftColumn',
      callback: blist.metrics.topAppTokensCallback,
      top: 'APPS'
    }, {
      id: 'topQueries',
      displayName: 'Top Queries',
      heading: 'Queries',
      className: 'expanding',
      renderTo: 'rightColumn',
      callback: blist.metrics.topQueryStringsCallback,
      top: 'QUERIES'
    }]
  }, blist.metrics.metricsScreenOptions));

  $('#analyticsTimeControl').metricsTimeControl({
    metricsScreen: screen
  });
});
