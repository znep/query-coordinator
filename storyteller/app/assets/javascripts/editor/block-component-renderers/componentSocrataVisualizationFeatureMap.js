import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from '../../StorytellerUtils';
import { flyoutRenderer } from '../FlyoutRenderer';

$.fn.componentSocrataVisualizationFeatureMap = componentSocrataVisualizationFeatureMap;

export default function componentSocrataVisualizationFeatureMap(props) {
  props = _.extend({}, props, {
    resizeSupported: true,
    resizeOptions: {
      minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
    }
  });

  const $this = $(this);
  const { componentData } = props;

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'socrata.visualization.featureMap',
    `componentSocrataVisualizationFeatureMap: Unsupported component type ${componentData.type}`
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, componentData);
  }

  _updateVisualization($this, componentData);
  $this.componentBase(props);

  return $this;
}
function _renderTemplate($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'type');

  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  const $componentContent = $('<div>', { class: 'component-content' });
  const flyoutEvent = 'SOCRATA_VISUALIZATION_FLYOUT';

  $element.
    addClass(className).
    on('destroy', () => { $componentContent.triggerHandler('destroy'); }).
    on(flyoutEvent, (event) => {
      const payload = event.originalEvent.detail;

      if (payload !== null) {
        flyoutRenderer.render(payload);
      } else {
        flyoutRenderer.clear();
      }
    });

  $element.append($componentContent);
}

function _updateVisualization($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'value.vif');

  const renderedVif = $element.attr('data-rendered-vif') || '{}';
  const $componentContent = $element.find('.component-content');
  const vif = componentData.value.vif;
  const areNotEquivalent = !StorytellerUtils.vifsAreEquivalent(JSON.parse(renderedVif), vif);

  if (areNotEquivalent) {
    $element.attr('data-rendered-vif', JSON.stringify(vif));

    vif.unit = {
      one: 'record',
      other: 'records'
    };

    // At some point in the future we may want to do a check to see if the
    // datasetUid is available on `tileserver[1..n].api.us.socrata.com` before
    // falling back to the dataset's host domain.
    //
    // For now, this should be sufficient.
    vif.configuration.tileserverHosts = [
      'https://' + _.get(vif, 'series[0].dataSource.domain', vif.domain)
    ];
    vif.configuration.baseLayerUrl = _.get(vif, 'configuration.baseLayerUrl', Constants.SOCRATA_VISUALIZATION_FEATURE_MAP_DEFAULT_BASE_LAYER);
    vif.configuration.baseLayerOpacity = _.get(vif, 'configuration.baseLayerOpacity', 0.8);
    vif.configuration.hover = _.get(vif, 'configuration.hover', true);
    vif.configuration.locateUser = _.get(vif, 'configuration.locateUser', true);
    vif.configuration.panAndZoom = _.get(vif, 'conifugration.panAndZoom', true);

    // EN-7517 - Title and description of VisualizationAddController V1 vifs are not useful.
    //
    // The new viz implementations actually read from title and description and
    // will display them, but the VisualizationAdd controller will set the
    // title to the name of the column or something.
    if (_.get(vif, 'format.version') === 1) {
      vif.title = null;
      vif.description = null;
    }

    // Use triggerHandler since we don't want this to bubble
    $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
    $componentContent.socrataSvgFeatureMap(vif);
  }
}
