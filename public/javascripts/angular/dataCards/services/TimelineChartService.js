const angular = require('angular');

function TimelineChartService(I18n, PluralizeService) {

  /**
   * Precompute a bunch of things that are useful for rendering the timeline chart.
   *
   * @return {Object} with keys:
   *   @property {Date} minDate - the earliest date in the dataset,
   *   @property {Date} maxDate - the latest date in the dataset,
   *   @property {Number} minValue - the smallest value in the dataset,
   *   @property {Number} meanValue - the mean value in the dataset,
   *   @property {Number} maxValue - the largest value in the dataset,
   *   @property {Object[]} values - an array of objects with keys:
   *     @property {Date} date - the date at which this value occurs.
   *     @property {} filtered - the filtered value
   *     @property {} unfiltered - the unfiltered value
   */
  function transformChartDataForRendering(chartData) {

    var minDate = null;
    var maxDate = null;
    var minValue = Number.POSITIVE_INFINITY;
    var maxValue = Number.NEGATIVE_INFINITY;
    var meanValue;
    var allValues = chartData.map(function(datum) {

      if (minDate === null) {
        minDate = datum.date;
      } else if (datum.date < minDate) {
        minDate = datum.date;
      }

      if (maxDate === null) {
        maxDate = datum.date;
      } else if (datum.date > maxDate) {
        maxDate = datum.date;
      }

      if (datum.total < minValue) {
        minValue = datum.total;
      }

      if (datum.total > maxValue) {
        maxValue = datum.total;
      }

      return {
        date: datum.date.toDate(),
        filtered: datum.filtered,
        unfiltered: datum.total
      };
    });

    minValue = (minValue > 0) ? 0 : minValue;
    maxValue = (maxValue < 0) ? 0 : maxValue;
    meanValue = (maxValue + minValue) / 2;

    return {
      minDate: minDate.toDate(),
      maxDate: maxDate.toDate(),
      minValue: minValue,
      meanValue: meanValue,
      maxValue: maxValue,
      values: allValues
    };
  }

  function getVisualizationConfig(rowDisplayUnit, allowFilterChange) {
    return {
      configuration: {
        interactive: allowFilterChange,
        localization: {
          'FLYOUT_UNFILTERED_AMOUNT_LABEL': I18n.flyout.total,
          'FLYOUT_FILTERED_AMOUNT_LABEL': I18n.flyout.filteredAmount
        }
      },
      unit: getUnitConfiguration(rowDisplayUnit)
    };
  }

  function getUnitConfiguration(rowDisplayUnit) {
    rowDisplayUnit = rowDisplayUnit || I18n.common.row;

    return {
      one: rowDisplayUnit,
      other: PluralizeService.pluralize(rowDisplayUnit)
    };
  }

  function renderFlyout(payload) {
    if (!_.isObject(payload)) {
      return;
    }

    let flyoutContent = [
      `<div class="flyout-title">${payload.title}</div>`
    ];

    if (payload.unfilteredValue) {
      flyoutContent = flyoutContent.concat([
        '<div class="flyout-row">',
          `<span class="flyout-cell">${payload.unfilteredLabel}</span>`,
          `<span class="flyout-cell">${payload.unfilteredValue}</span>`,
        '</div>'
      ]);
    }

    if (payload.filteredValue) {
      let cellClass = payload.filteredBySelection ? 'is-selected' : 'emphasis';

      flyoutContent = flyoutContent.concat([
        '<div class="flyout-row">',
          `<span class="flyout-cell ${cellClass}">${payload.filteredLabel}</span>`,
          `<span class="flyout-cell ${cellClass}">${payload.filteredValue}</span>`,
        '</div>'
      ]);
    }

    flyoutContent = flyoutContent.join('');

    return flyoutContent;
  }

  return {
    transformChartDataForRendering,
    getVisualizationConfig,
    getUnitConfiguration,
    renderFlyout
  };
}

angular.
  module('dataCards.services').
  factory('TimelineChartService', TimelineChartService);
