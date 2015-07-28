window.socrata.storyteller.RichTextEditorManagerMocker = {

  self: this,

  mock: function() {
    window.socrata.storyteller.richTextEditorManager = {
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
    delete window.socrata.storyteller.richTextEditorManager;
  },

  setContentCallback: function(callback) {
    self.setContentCallback = callback;
  }

};
