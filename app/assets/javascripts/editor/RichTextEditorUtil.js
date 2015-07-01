;var RichTextEditorUtil = (function() {

  function _generateUpdateBlockTypeFn(blockType, shouldStripFormatFn) {

    if (typeof shouldStripFormatFn !== 'function') {
      shouldStripFormatFn = function() { return false; }
    }

    function _elementIsBlockLevel(element) {
      return (
        [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'div',
          'p',
          'blockquote',
          'ol',
          'ul'
        ].
        indexOf(element.nodeName.toLowerCase()) > -1);
    }

    function _stripChildFormats(element, shouldStripFormatFn) {

      var newElement = element;

      if (shouldStripFormatFn(element)) {
        newElement = document.createDocumentFragment();
      }

      var childCount = element.childNodes.length;

      for (var i = 0; i < childCount; i++) {

        newElement.appendChild(
          _stripChildFormats(
            element.childNodes[i].cloneNode(true),
            shouldStripFormatFn
          )
        );
      }

      return newElement;
    }

    return function(blockFragment) {

      var newFragment = document.createDocumentFragment();
      var containerBlock = document.createElement(blockType);

      if (blockFragment.childNodes.length > 0) {

        var firstChild = blockFragment.childNodes[0];

        if (blockFragment.childNodes.length === 1 &&
          _elementIsBlockLevel(firstChild)) {

          var grandchildCount = firstChild.childNodes.length;

          for (var i = 0; i < grandchildCount; i++) {
            containerBlock.appendChild(
              _stripChildFormats(
                firstChild.childNodes[i].cloneNode(true),
                shouldStripFormatFn
              )
            );
          }
        }
      } else {

        containerBlock.appendChild(blockFragment);
      }

      newFragment.appendChild(containerBlock);
      return newFragment;
    }
  }

  return {
    generateUpdateBlockTypeFn: _generateUpdateBlockTypeFn
  };
})();
