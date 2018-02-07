import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import LinkModalStore from 'editor/stores/LinkModalStore';
import LinkTipStore from 'editor/stores/LinkTipStore';
import LinkTipRenderer, {__RewireAPI__ as LinkTipRendererAPI} from 'editor/renderers/LinkTipRenderer';

describe('LinkTipRenderer', function() {

  var $editor;
  var $body;
  var $linkTip;
  var renderer;
  var dispatcher;

  beforeEach(function() {
    $body = $('body');
    $editor = $('<div>', {'data-editor-id': 'test'});

    $body.append($editor);

    dispatcher = new Dispatcher();

    StoreAPI.__Rewire__('dispatcher', dispatcher);
    LinkTipRendererAPI.__Rewire__('dispatcher', dispatcher);
    LinkTipRendererAPI.__Rewire__('linkModalStore', new LinkModalStore());
    LinkTipRendererAPI.__Rewire__('linkTipStore', new LinkTipStore());

    renderer = new LinkTipRenderer();

    dispatcher.dispatch({
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

    StoreAPI.__ResetDependency__('dispatcher');
    LinkTipRendererAPI.__ResetDependency__('dispatcher');
    LinkTipRendererAPI.__ResetDependency__('linkModalStore');
    LinkTipRendererAPI.__ResetDependency__('linkTipStore');
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
      var text;
      var dispatch;

      beforeEach(function() {
        dispatch = sinon.spy(dispatcher, 'dispatch');
        text = document.createTextNode('Hello, World!');

        $body.append(text);

        LinkTipRendererAPI.__Rewire__('richTextEditorManager', {
          getEditor: function() {
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
        });
      });

      afterEach(function() {
        dispatch.restore();

        LinkTipRendererAPI.__ResetDependency__('richTextEditorManager');

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
      dispatcher.dispatch({
        action: Actions.LINK_TIP_CLOSE
      });

      assert.isFalse($linkTip.hasClass('visible'));
    });
  });
});
