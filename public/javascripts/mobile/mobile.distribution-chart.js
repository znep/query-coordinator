require('socrata-visualizations').DistributionChart;
require('./styles/distribution-chart.scss');

var FlyoutRenderer = require('socrata-visualizations').views.FlyoutRenderer;

module.exports = function(values, $target) {
  'use strict';

  var vif = {
    aggregation: {
      'field': values.aggregationField,
      'function': values.aggregationFunction
    },
    columnName: values.columnName,
    domain: values.domain,
    datasetUid: values.datasetUid,
    configuration: {
      bucketType: 'linear',
      isMobile: true
    },
    filters: values.filters,
    type: 'distributionChart',
    'unit': {
      'one': 'row',
      'other': 'rows'
    }
  };

  // Distribution chart
  $target.socrataDistributionChart(vif);

  var $distributionChartContainer = $target.parent();
  $distributionChartContainer.append('<div class="mobile-flyout"></div>');

  $target.on('SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT', handleFlyout);

  function handleFlyout(event) {
    var payload = event.originalEvent.detail;

    if (_.isNull(payload)) {
      clearFlyout();
    } else {
      mobileFlyoutRender(payload);
      $distributionChartContainer.addClass('expanded');
    }
  }

  function clearFlyout() {
    $distributionChartContainer.removeClass('expanded');
    $distributionChartContainer.find('.mobile-flyout').html('');
  }

  // Filters
  $(document).on('appliedFilters.qfb.socrata', handleVifUpdated);

  function handleVifUpdated(event, data) {
    vif.filters = data.filters;

    var renderVifEvent = jQuery.Event('SOCRATA_VISUALIZATION_RENDER_VIF'); // eslint-disable-line

    renderVifEvent.originalEvent = {
      detail: vif
    };

    $target.trigger(renderVifEvent);
  }

  function mobileFlyoutRender(payload) {
    var valuesStyleClass = 'unfiltered';
    var filteredLabelLine = '';

    if (payload.filtered && payload.filtered != payload.unfiltered) {
      filteredLabelLine = '<div class="text-right filtered-values"><span>Filtered</span> ' +
        payload.filtered + '<span> ' + (payload.filtered > 1 ? vif.unit.other : vif.unit.one) + '</span></div>';

      valuesStyleClass = 'filtered';
    }

    var unFilteredLabelLine = '<div class="text-right total-values"><span>Total</span> ' +
      payload.unfiltered + '<span> ' + (payload.unfiltered > 1 ? vif.unit.other : vif.unit.one) + '</span></div>';

    // position.x - arrow.png half width
    var arrowMarginLeft = parseFloat(payload.x) - 16.5;

    var flyoutData = $('<div>', {
      'class': 'title-wrapper',
      'html':
        '<div class="labels mobile">' +
          '<div class="arrow" style="left: ' + arrowMarginLeft + 'px"></div>' +
          '<h4 class="title pull-left">' + payload.start + ' - ' + payload.end + '</h4>' +
          '<div class="values pull-right ' + valuesStyleClass + '">' + filteredLabelLine + unFilteredLabelLine + '</div>' +
        '</div>'
    });

    $distributionChartContainer.find('.mobile-flyout').html(flyoutData);
  }
};
