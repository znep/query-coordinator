import $ from 'jquery';
import _ from 'lodash';

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
 *      url: "https://bucket-name.s3.amazonaws.com/uploads/random/image.jpg",
 *      link: "http://this-image-is-a-link.example.com"
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
      'data-src': null,
      'data-document-id': null,
      'data-crop': null
    }
  );

  var $link = $(
    '<a>',
    {
      'href': null,
      'target': '_blank'
    }
  );

  $element.
    addClass(StorytellerUtils.typeToClassNameForComponentType(componentData.type)).
    append($link.append($imgElement));
}

function _updateImageAttributes($element, componentData) {
  var src;
  var imgSrc;
  var documentId;
  var crop;
  var documentIdAsStringOrNull;
  var altAttribute;
  var link;
  var $link = $element.find('a');
  var $imgElement = $element.find('img');

  StorytellerUtils.assertHasProperty(componentData, 'value');
  StorytellerUtils.assertHasProperty(componentData.value, 'url');
  StorytellerUtils.assertHasProperty(componentData.value, 'documentId');

  crop = _.get(componentData, 'value.crop', {});
  imgSrc = componentData.value.url;
  documentId = componentData.value.documentId; // May be null or undefined.
  documentIdAsStringOrNull = _.isNull(documentId) || _.isUndefined(documentId) ? null : String(documentId);
  altAttribute = componentData.value.alt;
  link = componentData.value.link;

  if (
    $imgElement[0].getAttribute('data-src') !== imgSrc ||
    $imgElement[0].getAttribute('data-document-id') !== documentIdAsStringOrNull ||
    !_.isEqual(JSON.parse($imgElement[0].getAttribute('data-crop')), crop)
  ) {
    _informHeightChanges($imgElement);
    src = _appendSaltToSource(imgSrc);

    $imgElement.
      attr('src', src).
      attr('data-src', imgSrc).
      attr('data-document-id', documentId).
      attr('data-crop', JSON.stringify(crop));
  }

  $link.attr('href', _.isEmpty(link) ? null : link);
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

// Utilize this to force an <img> src refresh with the same URL.
function _appendSaltToSource(src) {
  var now = Date.now();
  return _.includes(src, '?') ?
    src + '&salt=' + now :
    src + '?' + now;
}
