;var RichTextEditorManager = (function() {

  'use strict';

  function RichTextEditorManager(assetFinder) {

    if (!(assetFinder instanceof AssetFinder)) {
      throw new Error(
        '`assetFinder` must be an AssetFinder (is of type ' +
        (typeof assetFinder) +
        ').'
      );
    }

    var _assetFinder = assetFinder;
    var _editors = {};

    this.createEditor = function(editorId, preloadText) {

      var element = $('<div>', { class: 'text-editor', 'data-editor-id': editorId });

      _editors[editorId] = new RichTextEditor(element, editorId, _assetFinder, preloadText);

      return element;
    };

    this.getEditor = function(editorId) {

      var editor = null;

      if (_editors.hasOwnProperty(editorId)) {
        editor = _editors[editorId];
      }

      return editor;
    };
  }

  return RichTextEditorManager;
})();
