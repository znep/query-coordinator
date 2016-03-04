import $ from 'jQuery';
import StorytellerUtils from '../../StorytellerUtils';

/**
 * @function componentSpacer
 * @desc Renders out a <div.spacer>.
 * @param {object} componentData - An object with a type and value attribute
 * @returns {jQuery} - The rendered spacer jQuery element
 */
$.fn.componentSpacer = componentSpacer;

function componentSpacer(componentData) {
  var $this = $(this);

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'spacer',
    StorytellerUtils.format(
      'componentSpacer: Unsupported component type {0}',
      componentData.type
    )
  );
  StorytellerUtils.assert(
    $this.length === 1,
    'Selection must have exactly one element.'
  );

  $this.empty().append(_renderSpacerContent(componentData));

  return $this;
}

function _renderSpacerContent(componentData) {
  return $('<div>', {
    'class': StorytellerUtils.typeToClassNameForComponentType(componentData.type)
  });
}
