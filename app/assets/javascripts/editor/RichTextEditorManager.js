;var RichTextEditorManager = (function() {

  'use strict';

  function RichTextEditorManager() {

    var _editors = {};

    this.createEditor = function(editorId, preloadText) {

      var element = $('<div>', { class: 'text-editor', 'data-editor-id': editorId });

      _editors[editorId] = new RichTextEditor(element, editorId, preloadText);

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
