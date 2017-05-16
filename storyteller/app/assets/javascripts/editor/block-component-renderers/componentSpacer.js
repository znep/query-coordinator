import _ from 'lodash';
import $ from 'jquery';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertHasProperty } from 'common/js_utils';

/**
 * @function componentSpacer
 * @desc Renders out a <div.spacer>.
 * @param {object} componentData - An object with a type and value attribute
 * @returns {jQuery} - The rendered spacer jQuery element
 */
$.fn.componentSpacer = componentSpacer;

function componentSpacer(props) {
  props = _.extend({}, props, {
    editButtonSupported: false
  });

  const $this = $(this);
  const { componentData } = props;

  assertHasProperty(componentData, 'type');
  assert(
    componentData.type === 'spacer',
    `componentSpacer: Unsupported component type ${componentData.type}`
  );
  assert(
    $this.length === 1,
    'Selection must have exactly one element.'
  );

  $this.
    empty().
    componentBase(props).
    append(renderSpacerContent(componentData));

  return $this;
}

function renderSpacerContent(componentData) {
  return $('<div>', {
    'class': StorytellerUtils.typeToClassNameForComponentType(componentData.type)
  });
}
