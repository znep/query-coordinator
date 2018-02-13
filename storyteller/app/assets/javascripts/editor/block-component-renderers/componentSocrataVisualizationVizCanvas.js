import $ from 'jquery';
import _ from 'lodash';

import { assert, assertHasProperties, assertHasProperty, parseJsonOrEmpty } from 'common/js_utils';
import { VisualizationRenderer } from 'common/visualizations';
import { MetadataProvider } from 'common/visualizations/dataProviders';

import '../componentBase';
import Constants from '../Constants';
import I18n from '../I18n';
import StorytellerUtils from '../../StorytellerUtils';
import { updateVifWithDefaults, vifsAreEquivalent } from 'VifUtils';

$.fn.componentSocrataVisualizationVizCanvas = componentSocrataVisualizationVizCanvas;

export default function componentSocrataVisualizationVizCanvas(props) {
  _.defaults(props, {
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
    },
    resizeSupported: true,
    useMetadataCache: true // We want to cache requests for metadata, but not during test runs
  });

  const $this = $(this);
  const { componentData } = props;

  assertHasProperty(componentData, 'type');
  assert(
    componentData.type === 'socrata.visualization.vizCanvas',
    `componentSocrataVisualizationVizCanvas: Unsupported component type ${componentData.type}`
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, props);
  }

  _updateVisualization($this, props);
  $this.componentBase(props);

  return $this;
}

function _findMatchingVifInView(view, vifId) {
  assertHasProperty(view, 'displayFormat.visualizationCanvasMetadata.vifs');

  const vifs = view.displayFormat.visualizationCanvasMetadata.vifs;

  return _.find(vifs, { id: vifId });
}

function _getVif(visualizationConfig, useMetadataCache) {
  const { domain, datasetUid, vifId } = visualizationConfig;

  return new MetadataProvider({ datasetUid, domain }, useMetadataCache).
    getDatasetMetadata().
    then((view) => {
      const vif = _findMatchingVifInView(view, vifId);
      return vif || Promise.reject({status: 404, message: `Could not find VIF with id ${vifId} in the view.`});
    });
}

function _renderTemplate($element, props) {
  const { componentData } = props;

  assertHasProperties(
    componentData,
    'value.dataset.domain',
    'value.dataset.datasetUid',
    'value.dataset.vifId'
  );

  const { type } = componentData;
  const className = StorytellerUtils.typeToClassNameForComponentType(type);
  const $componentContent = $('<div>', { class: 'component-content' });

  $element.
    addClass(className).
    on('destroy', () => { $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY'); }).
    append($componentContent);
}

function _updateVisualization($element, props) {
  const { componentData, useMetadataCache } = props;

  assertHasProperties(
    componentData,
    'value.dataset.domain',
    'value.dataset.datasetUid',
    'value.dataset.vifId'
  );

  function _renderVisualization(newVif) {
    const vifsAreNotEquivalent = !vifsAreEquivalent(
      parseJsonOrEmpty($element.attr('data-rendered-vif')),
      newVif
    );

    if (vifsAreNotEquivalent) {
      $element.attr('data-rendered-vif', JSON.stringify(newVif));
      $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');

      // Note, we're not updating with `federatedFromDomain` like other viz because the
      // viz-canvas vif already has origin.url set to the correct location.
      new VisualizationRenderer(
        updateVifWithDefaults(newVif),
        $componentContent,
        { displayFilterBar: true }
      );
    }
  }

  function _renderError(statusCode = '') {
    $('.socrata-visualization-error', $element).remove();

    const knownStatusCodes = ['403', '404'];
    const statusCodeKey = `status_${_.includes(knownStatusCodes, statusCode.toString()) ? statusCode : 'unspecified'}`;
    const errorMessage = I18n.t(`editor.viz_canvas.errors.${statusCodeKey}`);
    const containerHeight = `${_.get(componentData, 'value.layout.height', props.resizeOptions.minHeight)}px`;
    // Fake the visualization's internal error rendering
    const $errorMessageElement = $(`
      <div style="height: ${containerHeight}" class="socrata-visualization socrata-visualization-error">
        <div class="socrata-visualization-error-container error light">
          <span class="socrata-visualization-error-message text">
            ${errorMessage}
          </span>
        </div>
      </div>
    `);

    $componentContent.append($errorMessageElement);
  }

  const renderedVisualizationConfig = parseJsonOrEmpty($element.attr('data-rendered-visualization'));
  const $componentContent = $element.find('.component-content');
  const visualizationConfig = componentData.value.dataset;
  const configsAreEquivalent = _.isEqual(renderedVisualizationConfig, visualizationConfig);

  // Re-fetch viz-canvas view and associated vif if any part of the block configuration changes
  // else re-render the vizualization from the previously rendered vif
  if (!configsAreEquivalent) {
    _getVif(visualizationConfig, useMetadataCache).
      then((vif) => {
        $element.attr('data-rendered-visualization', JSON.stringify(visualizationConfig));
        _renderVisualization(vif);
      }).
      catch((error) => {
        console.error('Failed to get view for configured visualization: ', visualizationConfig);
        console.error(error);
        _renderError(error.status);
      });
  } else {
    try {
      const renderedVif = JSON.parse($element.attr('data-rendered-vif'));
      _renderVisualization(renderedVif);
    } catch (error) {
      console.error('Failed to parse previously rendered vif:', error);
      _renderError();
    }
  }
}
