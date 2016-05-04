require('socrata-visualizations').DistributionChart;
require('./styles/distribution-chart.scss');

import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import MobileChartFlyout from './react-components/mobileFlyout/mobileChartFlyout';

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
    unit: {
      one: 'row',
      other: 'rows'
    }
  };

  // Distribution chart
  $target.socrataDistributionChart(vif);

  var $distributionChartContainer = $target.parent();
  $distributionChartContainer.append('<div class="mobile-flyout hidden"></div>');

  $target.on('SOCRATA_VISUALIZATION_DISTRIBUTION_CHART_FLYOUT', handleFlyout);

  function handleFlyout(event) {
    var payload = event.originalEvent.detail;

    if (_.isNull(payload)) {
      clearFlyout();
    } else {
      mobileFlyoutRender(payload);
      $distributionChartContainer.addClass('expanded');
      $distributionChartContainer.find('.mobile-flyout').toggleClass('hidden', false);
    }
  }

  function clearFlyout() {
    $distributionChartContainer.removeClass('expanded');
    $distributionChartContainer.find('.mobile-flyout').toggleClass('hidden', true).empty();
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
    var flyoutContainer = $distributionChartContainer.find('.mobile-flyout').empty()[0];
    var arrowMarginLeft = parseFloat(payload.x) - 16.5;
    var title = '{0} - {1}'.format(payload.start, payload.end);

    ReactDOM.render(<MobileChartFlyout
      title={ title }
      filteredValue={ payload.filtered != payload.unfiltered ? payload.filtered : false }
      unFilteredValue={ payload.unfiltered }
      arrowPosition={ arrowMarginLeft }
      unit={ vif.unit } />, flyoutContainer);
  }
};
