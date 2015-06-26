;var RichTextEditorManager = (function() {

  'use strict';

  function RichTextEditorManager(assetFinder, toolbar, formats) {

    if (!(assetFinder instanceof AssetFinder)) {
      throw new Error(
        '`assetFinder` must be an AssetFinder (is of type ' +
        (typeof assetFinder) +
        ').'
      );
    }

    if (!(toolbar instanceof RichTextEditorToolbar)) {
      throw new Error(
        '`toolbar` must be a RichTextEditorToolbar (is of type ' +
        (typeof toolbar) +
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
    var _formats = formats;
    var _toolbar = toolbar;
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

    this.linkToolbarToEditor = function(editorId) {
      _toolbar.link(this.getEditor(editorId).getFormatController());
    };
  }

  return RichTextEditorManager;
})();
