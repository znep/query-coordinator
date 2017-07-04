const _ = require('lodash');
const $ = require('jquery');

const VifHelpers = require('./helpers/VifHelpers');
const SvgColumnChart = require('./views/SvgColumnChart');
const MetadataProvider = require('./dataProviders/MetadataProvider');
const CategoricalDataManager = require(
  './dataProviders/CategoricalDataManager'
);
const I18n = require('common/i18n').default;
const getSoqlVifValidator = require(
  './dataProviders/SoqlVifValidator.js'
).getSoqlVifValidator;

const WINDOW_RESIZE_RERENDER_DELAY = 200;

$.fn.socrataSvgColumnChart = function(originalVif, options) {

  originalVif = VifHelpers.migrateVif(originalVif);

  const $element = $(this);
  const visualization = new SvgColumnChart($element, originalVif, options);

  let rerenderOnResizeTimeout;

  /**
   * Event handling
   */

  function attachApiEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one(
      'SOCRATA_VISUALIZATION_DESTROY',
      () => {

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
    $element.on('SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT', handleFlyout);
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
    $element.off('SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT', handleFlyout);
  }

  function handleWindowResize() {

    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      visualization.render(),
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

    updateData(
      VifHelpers.migrateVif(newVif)
    );
  }

  function handleError(error) {
    let messages;

    if (window.console && console.error) {
      console.error(error);
    }

    if (error.errorMessages) {
      messages = error.errorMessages;
    } else {
      messages = I18n.t('shared.visualizations.charts.common.error_generic');
    }

    visualization.renderError(messages);
  }

  function updateData(newVif) {
    const skipPromise = _.constant(Promise.resolve(null));
    const domain = _.get(newVif, 'series[0].dataSource.domain');
    const datasetUid = _.get(newVif, 'series[0].dataSource.datasetUid');
    const datasetMetadataProvider = new MetadataProvider({ domain, datasetUid });

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');
    visualization.showBusyIndicator();
    detachInteractionEvents();

    $.fn.socrataSvgColumnChart.validateVif(newVif).
      then(visualization.shouldDisplayFilterBar() ? datasetMetadataProvider.getDisplayableFilterableColumns : skipPromise).
      then((columns) => {
        return Promise.all([
          Promise.resolve(columns),
          CategoricalDataManager.getData(newVif)
        ]);
      }).
      then((resolutions) => {
        const [ newColumns, newData ] = resolutions;
        renderVisualization(newVif, newData, newColumns);
      }).
      catch(handleError);
  }

  function renderVisualization(vifToRender, dataToRender, columnsToRender) {
    const overMaxRowCount = (
      dataToRender.rows.length > CategoricalDataManager.MAX_ROW_COUNT
    );
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

    if (overMaxRowCount) {

      visualization.renderError(
        I18n.t(
          'shared.visualizations.charts.bar_chart.error_exceeded_max_bar_count'
        ).format(CategoricalDataManager.MAX_ROW_COUNT)
      );
    } else if (onlyNullOrZeroValues) {

      visualization.renderError(
        I18n.t('shared.visualizations.charts.common.error_no_data')
      );
    } else {

      attachInteractionEvents();
      visualization.render(vifToRender, dataToRender, columnsToRender);
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
$.fn.socrataSvgColumnChart.validateVif = (vif) =>
  getSoqlVifValidator(vif).then(validator =>
    validator.
      requireAtLeastOneSeries().
      requireExactlyOneSeriesIfDimensionGroupingEnabled().
      toPromise()
  );

module.exports = $.fn.socrataSvgColumnChart;
