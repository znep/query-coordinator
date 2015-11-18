describe('LinkTipRenderer', function() {
  'use strict';

  var $editor;
  var $body;
  var $linkTip;
  var renderer;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    $body = $('body');
    $editor = $('<div>', {'data-editor-id': 'test'});

    $body.append($editor);

    renderer = new storyteller.LinkTipRenderer();

    storyteller.dispatcher.dispatch({
      action: Actions.LINK_TIP_OPEN,
      editorId: 'test',
      text: 'text',
      link: 'https://google.com',
      openInNewWindow: true,
      boundingClientRect: {
        left: 0,
        width: 100
      }
    });

    $linkTip = $('#link-tip');
  });

  afterEach(function() {
    $editor.remove();
    renderer.destroy();
  });

  describe('rendering', function() {
    it('should have an achor tag', function() {
      assert.equal($linkTip.children('.link-text').length, 1);
    });

    it('should have an edit button with the correct action', function() {
      var $child = $linkTip.children('.link-edit');
      assert.equal($child.length, 1);
      assert.equal($child.attr('data-action'), Actions.LINK_MODAL_OPEN);
    });

    it('should have a removal button with the correct action', function() {
      var $child = $linkTip.children('.link-remove');
      assert.equal($child.length, 1);
      assert.equal($child.attr('data-action'), Actions.LINK_TIP_REMOVE);
    });
  });

  describe('events', function() {
    describe('causing dispatches', function() {
      var manager;
      var text;
      var dispatch;

      beforeEach(function () {
        var range = document.createRange();

        dispatch = sinon.spy(storyteller.dispatcher, 'dispatch');
        manager = storyteller.richTextEditorManager;
        text = document.createTextNode('Hello, World!');

        $body.append(text);

        // Intense mock of richTextEditorManager
        storyteller.richTextEditorManager = {
          getEditor: function () {
            return {
              getSquireInstance: function() {
                return {
                  getSelection: _.constant({
                    startContainer: text
                  }),
                  setSelection: _.noop
                };
              }
            };
          }
        };
      });

      afterEach(function () {
        dispatch.restore();
        storyteller.richTextEditorManager = manager;
        $body[0].removeChild(text);
      });

      it('should dispatch LINK_MODAL_OPEN when edit is clicked', function() {
        $('.link-edit').click();

        assert.isTrue(dispatch.calledOnce);
        assert.isTrue(dispatch.calledWith({
          action: Actions.LINK_MODAL_OPEN,
          editorId: 'test',
          text: 'text',
          link: 'https://google.com',
          openInNewWindow: true
        }));
      });

      it('should dispatch LINK_TIP_REMOVE when remove is clicked', function() {
        $('.link-remove').click();

        assert.isTrue(dispatch.calledOnce);
        assert.isTrue(dispatch.calledWith({
          action: Actions.LINK_TIP_REMOVE
        }));
      });
    });

    it('should close when dispatching updates visibility', function() {
      storyteller.dispatcher.dispatch({
        action: Actions.LINK_TIP_CLOSE
      });

      assert.isFalse($linkTip.hasClass('visible'));
    });
  });
});
