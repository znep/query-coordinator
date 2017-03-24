blist.namespace.fetch('blist.metrics');

$(function() {
  var screen = $('#analyticsDataContainer').metricsScreen(blist.metrics.sitewideShared);

  $('#analyticsTimeControl').metricsTimeControl({
    metricsScreen: screen
  });
});
