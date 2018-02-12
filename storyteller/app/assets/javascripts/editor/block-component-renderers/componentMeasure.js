import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

import { fetchJsonWithDefaultHeaders } from 'common/http';
import I18n from 'common/i18n';
import MeasureChart from 'common/performance_measures/components/MeasureChart';
import MeasureResultCard from 'common/performance_measures/components/MeasureResultCard';

import '../componentBase';
import Constants from '../Constants';
import StorytellerUtils from 'StorytellerUtils';
import { assert, assertHasProperty } from 'common/js_utils';

$.fn.componentMeasure = componentMeasure;

// This component supports measure.card and measure.chart.
export default function componentMeasure(props) {
  assertHasProperty(props, 'componentData.type');
  const componentType = _.get(props, 'componentData.type');

  assert(
    componentType === 'measure.chart' || componentType === 'measure.card',
    `componentMeasure: Unsupported component type ${componentType}`
  );

  props = _.extend({}, props, {
    resizeSupported: componentType === 'measure.chart',
    defaultHeight: Constants.DEFAULT_VISUALIZATION_HEIGHT
  });

  const $this = $(this);

  if ($this.children().length === 0) {
    renderTemplate($this, props);
  }

  updateMeasure($this, props);
  $this.componentBase(props);

  return $this;
}

function renderTemplate($element, props) {
  const { componentData } = props;
  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  const $componentContent = $('<div>', { class: 'component-content' });
  const $componentError = $('<div>', { class: 'component-error' });

  $componentError.text(I18n.t('editor.components.performance_measures.generic_error'));

  assertHasProperty(componentData, 'type');

  $element.
    addClass(className).
    on('destroy', () => {
      ReactDOM.unmountComponentAtNode($element[0]);
    });

  $element.append($componentContent).append($componentError);
}

function updateMeasure($element, props) {
  const { componentData } = props;
  const componentType = _.get(componentData, 'type');
  const renderedUid = $element.attr('data-rendered-uid');
  const measureUid = _.get(componentData, 'value.measure.uid');

  // TODO we may want to use a HOC here instead. However, for
  // now this jQuery-based approach has proven to be simpler.
  if (measureUid !== renderedUid) {
    $element.attr('data-rendered-uid', measureUid).
      data('data-rendered-measure', null).
      data('data-rendered-error', null);

    fetchJsonWithDefaultHeaders(`/api/measures_v1/${measureUid}.json`, { credentials: 'same-origin' } ).
      then(
        (measure) => {
          $element.data('data-rendered-measure', measure);
        },
        (error) => {
          $element.data('data-rendered-error', error);
        }
      ).finally(() => {
        updateMeasure($element, props);
      });

    fetchJsonWithDefaultHeaders(`/api/views/${measureUid}.json`, { credentials: 'same-origin' } ).
      then(
        (view) => {
          $element.data('data-rendered-view', view);
        },
        (error) => {
          $element.data('data-rendered-error', error);
        }
      ).finally(() => {
        updateMeasure($element, props);
      });
  }

  $element.toggleClass('load-error', !!$element.data('data-rendered-error'));

  const $componentContent = $element.find('.component-content');
  assert($componentContent.length === 1);

  // Might be blank, MeasureResultCard/MeasureChart will show a spinner in that case.
  const renderedMeasure = $element.data('data-rendered-measure');
  const renderedView = $element.data('data-rendered-view');
  const MeasureComponent = componentType === 'measure.chart' ? MeasureChart : MeasureResultCard;

  ReactDOM.render(<MeasureComponent
    measure={renderedMeasure} lens={renderedView} showMetadata />,
    $componentContent[0]);
}
