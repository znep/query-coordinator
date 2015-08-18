window.socrata.storyteller.RichTextEditorManagerMocker = {

  mock: function() {
    window.socrata.storyteller.RichTextEditorManagerMocker.spies = {
      createEditorSpy: sinon.spy(_.constant(true)),
      deleteEditorSpy: sinon.spy(),
      setContentSpy: sinon.spy(),
      getEditorSpy: sinon.spy(function(callback) {
        return {
          setContent: window.socrata.storyteller.RichTextEditorManagerMocker.spies.setContentSpy
        };
      })
    };

    window.socrata.storyteller.richTextEditorManager = {
      createEditor: window.socrata.storyteller.RichTextEditorManagerMocker.spies.createEditorSpy,
      deleteEditor: window.socrata.storyteller.RichTextEditorManagerMocker.spies.deleteEditorSpy,
      getEditor: window.socrata.storyteller.RichTextEditorManagerMocker.spies.getEditorSpy
    };
  },

  unmock: function() {
    delete window.socrata.storyteller.richTextEditorManager;
  }
};
