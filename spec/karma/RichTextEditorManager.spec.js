describe('RichTextEditorManager', function() {

  describe('instance variables', function() {

    it('should should not expose `_editors` directly', function() {

      var manager = new RichTextEditorManager();

      assert.isUndefined(manager._editors, '`_editors` is undefined on text editor manager');
    });
  });

  describe('.getEditor()', function() {

    var manager;

    beforeEach(function() {
      manager = new RichTextEditorManager();
    });

    describe('when called with a non-existent editor id', function() {
      it('should return null', function() {
        assert.isNull(manager.getEditor('does not exist'), 'returns null');
      });
    });

    describe('when called with an editor id that exists', function() {
      it('should return an editor instance', function() {
        manager.createEditor('1', 'Hello, world!');
        assert.instanceOf(manager.getEditor('1'), RichTextEditor, 'returns an instance of RichTextEditor');
      });
    });
  });
});
