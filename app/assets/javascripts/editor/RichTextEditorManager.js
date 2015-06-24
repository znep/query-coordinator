;var RichTextEditorManager = (function() {

  'use strict';

  function RichTextEditorManager(assetFinder, formats, toolbarElement) {

    if (!(assetFinder instanceof AssetFinder)) {
      throw new Error(
        '`assetFinder` must be an AssetFinder (is of type ' +
        (typeof assetFinder) +
        ').'
      );
    }

    if (!(toolbarElement instanceof jQuery)) {
      throw new Error(
        '`toolbarElement` must be a jQuery object (is of type ' +
        (typeof toolbarElement) +
        ').'
      );
    }

    if (!(formats instanceof Array)) {
      throw new Error(
        '`formats` must be an array (is of type ' +
        (typeof formats) +
        ').'
      );
    }

    var _assetFinder = assetFinder;
    var _toolbar = new RichTextEditorToolbar(toolbarElement, formats);
    var _formats = formats;
    var _editors = {};

    this.createEditor = function(editorId, preloadText) {

      var element = $('<div>', { class: 'text-editor', 'data-editor-id': editorId });

      _editors[editorId] = new RichTextEditor(element, editorId, _assetFinder, _formats, preloadText);

      return element;
    };

    this.getEditor = function(editorId) {

      var editor = null;

      if (_editors.hasOwnProperty(editorId)) {
        editor = _editors[editorId];
      }

      return editor;
    };

    this.linkEditorToToolbar = function(editorId) {
      _toolbar.link(this.getEditor(editorId).getFormatController());
    };
  }

  return RichTextEditorManager;
})();
