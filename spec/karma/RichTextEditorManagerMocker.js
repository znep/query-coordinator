(function (root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;

  storyteller.RichTextEditorManagerMocker = {

    // Spies

    setContentSpy: sinon.spy(),
    createEditorSpy: sinon.spy(_.constant(true)),
    deleteEditorSpy: sinon.spy(),
    getEditorSpy: sinon.spy(function(callback) {
      return {
        setContent: storyteller.RichTextEditorManagerMocker.setContentSpy
      };
    }),

    // Auxillary

    reset: function() {
      for(var key in storyteller.RichTextEditorManagerMocker) {
        if (/Spy/.test(key)) {
          storyteller.RichTextEditorManagerMocker[key].reset();
        }
      }
    },

    mock: function() {
      storyteller.RichTextEditorManagerMocker.reset();

      storyteller.richTextEditorManager = {
        createEditor: storyteller.RichTextEditorManagerMocker.createEditorSpy,
        deleteEditor: storyteller.RichTextEditorManagerMocker.deleteEditorSpy,
        getEditor: storyteller.RichTextEditorManagerMocker.getEditorSpy
      };
    },

    unmock: function() {
      delete storyteller.richTextEditorManager;
    }
  };

})(window);
