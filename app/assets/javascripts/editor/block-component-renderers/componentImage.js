import $ from 'jQuery';

import '../componentBase';
import CustomEvent from '../../CustomEvent';
import StorytellerUtils from '../../StorytellerUtils';

/**
 * Creates or updates an image component
 * based on the componentData, theme, and options.
 *
 * @param {object} componentData - Data for image block. See below.
 * @param {string} theme - Theme name. Currently not used.
 * @param {object} options - Renderer settings. Optional. See below.
 *
 *
 * Sample componentData:
 *  {
 *    type: "image",
 *    value: {
 *      documentId: "1234",
 *      url: "https://bucket-name.s3.amazonaws.com/uploads/random/image.jpg"
 *    }
 *  }
 *
 * Supported options (default):
 *  - editMode (false): If true, renders an edit button on hover. The edit button
 *    dispatches Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED.
 */
$.fn.componentImage = componentImage;

export default function componentImage(componentData, theme, options) {
  var $this = $(this);

  StorytellerUtils.assertHasProperties(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'image',
    StorytellerUtils.format(
      'componentImage: Unsupported component type {0}',
      componentData.type
    )
  );

  if ($this.children().length === 0) {
    _renderImage($this, componentData);
  }

  _updateImageAttributes($this, componentData);
  $this.componentBase(componentData, theme, options);

  return $this;
}

function _renderImage($element, componentData) {
  StorytellerUtils.assertHasProperty(componentData, 'type');

  var $imgElement = $(
    '<img>',
    {
      'src': null,
      'data-document-id': null
    }
  );

  $element.
    addClass(StorytellerUtils.typeToClassNameForComponentType(componentData.type)).
    append($imgElement);
}

function _updateImageAttributes($element, componentData) {
  var imgSrc;
  var documentId;
  var documentIdAsStringOrNull;
  var altAttribute;
  var $imgElement = $element.find('img');

  StorytellerUtils.assertHasProperty(componentData, 'value');
  StorytellerUtils.assertHasProperty(componentData.value, 'url');
  StorytellerUtils.assertHasProperty(componentData.value, 'documentId');

  imgSrc = componentData.value.url;
  documentId = componentData.value.documentId; // May be null or undefined.
  documentIdAsStringOrNull = _.isNull(documentId) || _.isUndefined(documentId) ? null : String(documentId);
  altAttribute = componentData.value.alt;

  if (
    $imgElement.attr('src') !== imgSrc ||
    $imgElement[0].getAttribute('data-document-id') !== documentIdAsStringOrNull
  ) {
    _informHeightChanges($imgElement);

    $imgElement.attr('src', imgSrc);
    $imgElement.attr('data-document-id', documentId);
  }

  $imgElement.attr('alt', _.isEmpty(altAttribute) ? null : altAttribute);
}

function _informHeightChanges($image) {
  StorytellerUtils.assertInstanceOf($image, $);

  $image.one('load', function() {
    $image[0].dispatchEvent(
      new CustomEvent(
        'component::height-change',
        { detail: {}, bubbles: true }
      )
    );
  });
}

