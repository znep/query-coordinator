import $ from 'jQuery';
import StorytellerUtils from '../../StorytellerUtils';

/**
 * @function componentHorizontalRule
 * @desc Renders out a <hr>.
 * @param {object} componentData - An object with a type and value attribute
 * @returns {jQuery} - The rendered horizontal rule jQuery element
 */
$.fn.componentHorizontalRule = componentHorizontalRule;

export default function componentHorizontalRule(componentData) {
  var $this = $(this);

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'horizontalRule',
    StorytellerUtils.format(
      'componentHorizontalRule: Unsupported component type {0}',
      componentData.type
    )
  );
  StorytellerUtils.assert(
    $this.length === 1,
    'Selection must have exactly one element.'
  );

  $this.
    empty().
    append(
      _renderHorizontalRuleContent(componentData)
    );

  return $this;
}

function _renderHorizontalRuleContent(componentData) {
  var className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  return $('<hr>', className);
}
