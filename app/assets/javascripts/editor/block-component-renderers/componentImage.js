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

  function _updateSrc($element, componentData) {

    var imgSrc;
    var documentId;
    var $imgElement = $element.find('img');

    utils.assertHasProperty(componentData, 'value');
    utils.assertHasProperty(componentData.value, 'url');
    utils.assertHasProperty(componentData.value, 'documentId');

    // youtubeSource = utils.generateYoutubeIframeSrc(componentData.value.id);
    imgSrc = componentData.value.url;
    documentId = componentData.value.documentId;

    if ($imgElement.attr('src') !== imgSrc || $imgElement.attr('data-document-id') !== String(documentId)) {
      _informHeightChanges($imgElement);

      $imgElement.attr('src', imgSrc);
      $imgElement.attr('data-document-id', documentId);
    }
  }

  function _informHeightChanges($image) {
    utils.assertInstanceOf($image, $);

    $image.one('load', function() {
      $image[0].dispatchEvent(
        new storyteller.CustomEvent(
          'component-image::height-change',
          { detail: {}, bubbles: true }
        )
      );
    });
  }

  function componentImage(componentData) {

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

    _updateSrc($this, componentData);

    return $this;
  }

  $.fn.componentImage = componentImage;
})(window, jQuery);
