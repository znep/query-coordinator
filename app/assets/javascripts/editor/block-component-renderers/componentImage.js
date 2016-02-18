(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _renderImage($element, componentData) {

    utils.assertHasProperty(componentData, 'type');

    var $imgElement = $(
      '<img>',
      {
        'src': null,
        'data-document-id': null
      }
    );

    $element.
      addClass(utils.typeToClassNameForComponentType(componentData.type)).
      append($imgElement);
  }

  function _updateImageAttributes($element, componentData) {

    var imgSrc;
    var documentId;
    var documentIdAsStringOrNull;
    var altAttribute;
    var $imgElement = $element.find('img');

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'url');
    utils.assertHasProperty(componentData.value, 'documentId');

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
    utils.assertInstanceOf($image, $);

    $image.one('load', function() {
      $image[0].dispatchEvent(
        new storyteller.CustomEvent(
          'component::height-change',
          { detail: {}, bubbles: true }
        )
      );
    });
  }

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
  function componentImage(componentData, theme, options) {

    var $this = $(this);

    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'image',
      'componentImage: Unsupported component type {0}'.format(
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

  $.fn.componentImage = componentImage;
})(window, jQuery);
