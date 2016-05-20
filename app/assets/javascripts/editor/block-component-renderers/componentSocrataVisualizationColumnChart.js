import $ from 'jQuery';
import _ from 'lodash';

import '../componentBase';
import I18n from '../I18n';
import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { flyoutRenderer } from '../FlyoutRenderer';

var FLYOUT_EVENT = (Environment.ENABLE_SVG_VISUALIZATIONS) ?
  'SOCRATA_VISUALIZATION_FLYOUT' :
  'SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT';
var VISUALIZATION_IMPLEMENTATION = (Environment.ENABLE_SVG_VISUALIZATIONS) ?
  'socrataSvgColumnChart' :
  'socrataColumnChart';

$.fn.componentSocrataVisualizationColumnChart = componentSocrataVisualizationColumnChart;

export default function componentSocrataVisualizationColumnChart(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'socrata.visualization.columnChart',
    StorytellerUtils.format(
      'componentSocrataVisualizationColumnChart: Tried to render type: {0}',
      componentData.type
    )
  );

  if ($this.children().length === 0) {
    _renderTemplate($this, componentData);
  }

  _updateVisualization($this, componentData);
  $this.componentBase(componentData, theme, _.extend(
    {
      resizeSupported: true,
      resizeOptions: {
        minHeight: Constants.MINIMUM_COMPONENT_HEIGHTS_PX.VISUALIZATION
      }
    },
    options
  ));

  return $this;
}

function _renderTemplate($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'type');

  var className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  var $componentContent = $('<div>', { class: 'component-content' });

  $element.
    addClass(className).
    on('destroy', function() { $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY'); }).
    on(FLYOUT_EVENT, function(event) {
      var payload = event.originalEvent.detail;

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

  var $componentContent = $element.find('.component-content');
  var renderedVif = $element.attr('data-rendered-vif') || '{}';
  var vif = componentData.value.vif;
  var areNotEquivalent = !StorytellerUtils.vifsAreEquivalent(JSON.parse(renderedVif), vif);

  if (areNotEquivalent) {
    $element.attr('data-rendered-vif', JSON.stringify(vif));

    vif.configuration.localization = {
      'NO_VALUE': I18n.t('editor.visualizations.no_value_placeholder'),
      'FLYOUT_UNFILTERED_AMOUNT_LABEL': I18n.t('editor.visualizations.flyout.unfiltered_amount_label'),
      'FLYOUT_FILTERED_AMOUNT_LABEL': I18n.t('editor.visualizations.flyout.filtered_amount_label'),
      'FLYOUT_SELECTED_NOTICE': I18n.t('editor.visualizations.flyout.datum_selected_label')
    };

    vif.unit = {
      one: 'record',
      other: 'records'
    };

    // Use triggerHandler since we don't want this to bubble
    $componentContent.triggerHandler('SOCRATA_VISUALIZATION_DESTROY');
    $componentContent[VISUALIZATION_IMPLEMENTATION](vif);
  }
}
