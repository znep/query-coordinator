;var RichTextEditorUtil = (function() {

  function _generateUpdateBlockTypeFn(blockType) {

    function _elementIsBlockLevel(element) {
      return (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'p'].
        indexOf(element.nodeName.toLowerCase()) > -1);
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
            containerBlock.appendChild(firstChild.childNodes[i].cloneNode(true));
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
