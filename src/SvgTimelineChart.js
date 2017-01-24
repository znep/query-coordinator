// Vendor Imports
const _ = require('lodash');
const $ = require('jquery');
const moment = require('moment');
// Project Imports
const VifHelpers = require('./helpers/VifHelpers');
const SvgTimelineChart = require('./views/SvgTimelineChart');
const SoqlHelpers = require('./dataProviders/SoqlHelpers');
const TimeDataManager = require('./dataProviders/TimeDataManager');
const I18n = require('./I18n');
const getSoqlVifValidator = require(
  './dataProviders/SoqlVifValidator.js'
).getSoqlVifValidator;
// Constants
const WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.socrataSvgTimelineChart = function(originalVif) {

  originalVif = VifHelpers.migrateVif(originalVif);

  const $element = $(this);
  const visualization = new SvgTimelineChart($element, originalVif);

  let rerenderOnResizeTimeout;

  /**
   * Event handling
   */

  function attachApiEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one(
      'SOCRATA_VISUALIZATION_DESTROY',
      function() {

        clearTimeout(rerenderOnResizeTimeout);
        visualization.destroy();
        detachInteractionEvents();
        detachApiEvents();
      }
    );

    $(window).on('resize', handleWindowResize);

    $element.on(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      visualization.invalidateSize
    );
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function attachInteractionEvents() {

    $element.on('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', handleFlyout);
  }

  function detachApiEvents() {

    $(window).off('resize', handleWindowResize);

    $element.off(
      'SOCRATA_VISUALIZATION_INVALIDATE_SIZE',
      visualization.invalidateSize
    );
    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', handleRenderVif);
  }

  function detachInteractionEvents() {

    $element.off('SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT', handleFlyout);
  }

  function handleWindowResize() {

    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      visualization.invalidateSize,
      // Add some jitter in order to make sure multiple visualizations are
      // unlikely to all attempt to rerender themselves at the exact same
      // moment.
      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
    );
  }

  function handleFlyout(event) {
    const payload = event.originalEvent.detail;

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_FLYOUT',
        {
          detail: payload,
          bubbles: true
        }
      )
    );
  }

  function handleRenderVif(event) {
    const newVif = event.originalEvent.detail;

    updateData(VifHelpers.migrateVif(newVif));
  }

  function handleError(error) {
    let messages;

    if (window.console && console.error) {
      console.error(error);
    }

    if (error.errorMessages) {
      messages = error.errorMessages;
    } else {
      messages = I18n.translate('visualizations.common.error_generic')
    }

    visualization.renderError(messages);
  }

  function updateData(newVif) {

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');
    visualization.showBusyIndicator();
    detachInteractionEvents();

    $.fn.socrataSvgTimelineChart.validateVif(newVif).
      then(() => TimeDataManager.getData(newVif)).
      then((newData) => renderVisualization(newVif, newData)).
      catch(handleError);
  }

  function renderVisualization(vifToRender, dataToRender) {
    const underTwoRows = dataToRender.rows.length < 2;
    const overMaxRowCount =
      dataToRender.rows.length > TimeDataManager.MAX_ROW_COUNT;
    const dimensionIndex = dataToRender.columns.indexOf('dimension');
    const allSeriesMeasureValues = dataToRender.rows.map((row) => {
      return row.slice(dimensionIndex + 1);
    });
    const onlyNullOrZeroValues = _.chain(allSeriesMeasureValues).
      flatten().
      compact().
      isEmpty().
      value();

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
    visualization.hideBusyIndicator();

    if (underTwoRows) {

      visualization.renderError(
        I18n.translate(
          'visualizations.timeline_chart.error_two_or_more_rows_required'
        )
      );
    } else if (overMaxRowCount) {

      visualization.renderError(
        I18n.translate(
          'visualizations.timeline_chart.error_exceeded_max_row_count'
        ).format(TimeDataManager.MAX_ROW_COUNT)
      );
    } else if (onlyNullOrZeroValues) {

      visualization.renderError(
        I18n.translate('visualizations.common.error_no_data')
      );
    } else {

      attachInteractionEvents();
      visualization.render(vifToRender, dataToRender);
    }
  }

  /**
   * Actual execution starts here
   */

  attachApiEvents();
  updateData(originalVif);

  return this;
};

/**
 * Checks a VIF for compatibility with this visualization. The intent of this
 * function is to provide feedback while authoring a visualization, not to
 * provide feedback to a developer. As such, messages returned are worded to
 * make sense to a user.
 *
 * Returns a Promise.
 *
 * If the VIF is usable, the promise will resolve.
 * If the VIF is not usable, the promise will reject with an object:
 * {
 *   ok: false,
 *   errorMessages: Array<String>
 * }
 */
$.fn.socrataSvgTimelineChart.validateVif = (vif) =>
  getSoqlVifValidator(vif).then(validator =>
    validator.
      requireAtLeastOneSeries().
      requireCalendarDateDimension().
      toPromise()
  );

module.exports = $.fn.socrataSvgTimelineChart;
