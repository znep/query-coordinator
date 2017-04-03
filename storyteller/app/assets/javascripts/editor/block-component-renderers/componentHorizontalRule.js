import $ from 'jquery';
import StorytellerUtils from '../../StorytellerUtils';

/**
 * @function componentHorizontalRule
 * @desc Renders out a <hr>.
 * @param {object} componentData - An object with a type and value attribute
 * @returns {jQuery} - The rendered horizontal rule jQuery element
 */
$.fn.componentHorizontalRule = componentHorizontalRule;

export default function componentHorizontalRule(props) {
  props = _.extend({}, props, { editButtonSupported: false });

  const $this = $(this);
  const { componentData } = props;

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'horizontalRule',
    `componentHorizontalRule: Unsupported component type ${componentData.type}`
  );
  StorytellerUtils.assert(
    $this.length === 1,
    'Selection must have exactly one element.'
  );

  $this.
    empty().
    componentBase(props).
    append(renderHorizontalRuleContent(componentData));

  return $this;
}

function renderHorizontalRuleContent(componentData) {
  const className = StorytellerUtils.typeToClassNameForComponentType(componentData.type);
  return $('<hr>', className);
}
