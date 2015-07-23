var RichTextEditorManagerMocker = {

  self: this,

  mock: function() {
    window.richTextEditorManager = {
      createEditor: function() { return true; },

      getEditor: function(callback) {
        return {
          setContent: function(content) {
            self.setContentCallback(content);
          }
        }
      }
    };
  },

  unmock: function() {
    delete window.richTextEditorManager;
  },

  setContentCallback: function(callback) {
    self.setContentCallback = callback;
  }

};
