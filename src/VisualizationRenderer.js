import _ from 'lodash';
import $ from 'jquery';

import { translate } from './I18n';
import { migrateVif } from './helpers/VifHelpers';

// import these to make sure the jquery plugins have been initialized
import './SvgBarChart';
import './SvgColumnChart';
import './SvgFeatureMap';
import './SvgHistogram';
import './SvgPieChart';
import './SvgRegionMap';
import './SvgTimelineChart';
import './Table';

import { RowInspector, FlyoutRenderer } from './views';

/**
 * Instantiates a Socrata Visualization from the `socrata-visualizations` package,
 * based on the visualization type indicated in the VIF.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 * @param element - element to render the visualization inside of
 */
export const VisualizationRenderer = function(vif, element) {
  const $element = $(element);
  $element.addClass('socrata-visualization-renderer');

  let flyoutRenderer;

  this.vif = vif;

  const onFlyout = (event) => {
    const payload = event.originalEvent.detail;

    if (_.isUndefined(flyoutRenderer)) {
      return;
    }

    if (_.isNull(payload)) {
      flyoutRenderer.clear();
    } else {
      flyoutRenderer.render(payload);
    }
  };

  const initializeVisualization = () => {
    const visualizationType = _.get(this.vif, 'series[0].type', null);

    switch (visualizationType) {
      case 'barChart':
        $element.socrataSvgBarChart(this.vif);
        break;

      case 'columnChart':
        $element.socrataSvgColumnChart(this.vif);
        break;

      case 'featureMap':
        $element.socrataSvgFeatureMap(this.vif);
        // RowInspector is the detailed flannel handler for feature maps
        RowInspector.setup();
        break;

      case 'histogram':
        $element.socrataSvgHistogram(this.vif);
        break;

      case 'pieChart':
        $element.socrataSvgPieChart(this.vif);
        break;

      case 'regionMap':
        $element.socrataSvgRegionMap(this.vif);
        break;

      case 'table':
        $element.socrataTable(this.vif);
        break;

      case 'timelineChart':
        $element.socrataSvgTimelineChart(this.vif);
        break;

      case 'timelineChart.line':
        $element.socrataSvgTimelineChart(this.vif);
        break;

      default:
        // Something is terribly wrong with the VIF, render an error message
        return renderVifError();
    }

    // FlyoutRenderer (via onFlyout) is used by all visualizations
    flyoutRenderer = new FlyoutRenderer();
    $element.on('SOCRATA_VISUALIZATION_FLYOUT', onFlyout);
  };

  const updateVisualization = () => {
    const renderVifEvent = new $.Event('SOCRATA_VISUALIZATION_RENDER_VIF');
    renderVifEvent.originalEvent = {
      detail: this.vif
    };

    $element.trigger(renderVifEvent);
  };

  const renderVifError = () => {
    const $errorMessage = $(
      `<div class="alert error"><span>${translate('visualizations.common.error_generic')}</span></div>`
    );

    $element.append($errorMessage);
  };

  const render = () => {
    if (_.isEmpty(this.vif)) {
      return renderVifError();
    } else {
      this.vif = migrateVif(this.vif);
    }

    if ($element.children().length > 0) {
      updateVisualization();
    } else {
      initializeVisualization();
    }
  };

  this.update = (newVif) => {
    const currentType = _.get(this.vif, 'series[0].type', null);
    const newType = _.get(newVif, 'series[0].type', null);

    if (currentType !== newType) {
      this.destroy();
    }

    this.vif = newVif;
    render();
  };

  this.destroy = () => {
    $element.
      trigger('SOCRATA_VISUALIZATION_DESTROY').
      off('SOCRATA_VISUALIZATION_FLYOUT', onFlyout).
      empty();
  };

  // Do initial render
  render();
};

export default VisualizationRenderer;
