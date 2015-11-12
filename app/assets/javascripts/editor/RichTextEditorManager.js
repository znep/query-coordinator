(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;

  function RichTextEditorManager(assetFinder, toolbar, formats) {

    var RichTextEditor = storyteller.RichTextEditor;

    if (!(assetFinder instanceof storyteller.AssetFinder)) {
      throw new Error(
        '`assetFinder` must be an AssetFinder (is of type ' +
        (typeof assetFinder) +
        ').'
      );
    }

    if (!(toolbar instanceof storyteller.RichTextEditorToolbar)) {
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

    this.createEditor = function(element, editorId, contentToPreload) {

      _editors[editorId] = new RichTextEditor(element, editorId, _assetFinder, _formats, contentToPreload);

      return _editors[editorId];
    };

    this.getEditor = function(editorId) {

      var editor = null;

      if (_editors.hasOwnProperty(editorId)) {
        editor = _editors[editorId];
      }

      return editor;
    };

    this.getAllEditors = function() {
      return _editors;
    };

    this.deleteEditor = function(editorId) {

      _editors[editorId].destroy();

      delete _editors[editorId];
    };

    this.linkToolbar = function(editorId) {
      _toolbar.link(this.getEditor(editorId).getFormatController());
    };

    this.unlinkToolbar = function() {
      _toolbar.unlink();
    };
  }

  storyteller.RichTextEditorManager = RichTextEditorManager;
})(window);
