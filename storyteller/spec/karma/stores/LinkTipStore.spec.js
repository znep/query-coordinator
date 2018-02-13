import _ from 'lodash';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import LinkTipStore from 'editor/stores/LinkTipStore';

describe('LinkTipStore', function() {

  var dispatcher;
  var linkTipStore;

  function dispatchAction(action, payload) {
    payload = _.extend({action: action}, payload);
    dispatcher.dispatch(payload);
  }

  beforeEach(function() {
    dispatcher = new Dispatcher();
    StoreAPI.__Rewire__('dispatcher', dispatcher);

    linkTipStore = new LinkTipStore();
  });

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
  });

  describe('Actions.LINK_TIP_OPEN', function() {
    describe('when given an incorrect payload', function() {
      it('should throw', function() {
        assert.throws(function() {
          dispatchAction(Actions.LINK_TIP_OPEN, {});
        });
      });
    });

    describe('when given a valid payload', function() {
      var payload = {
        text: 'text',
        link: 'link',
        openInNewWindow: true,
        editorId: 'id',
        boundingClientRect: 'boundingClientRect'
      };

      beforeEach(function() {
        dispatchAction(Actions.LINK_TIP_OPEN, payload);
      });

      it('should emit a change', function(done) {
        linkTipStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_TIP_OPEN, payload);
      });

      it('should update visibility to true', function() {
        assert.isTrue(linkTipStore.getVisibility());
      });

      it('should update inputs', function() {
        assert.deepEqual(linkTipStore.getInputs(), {
          text: 'text',
          link: 'link',
          openInNewWindow: true
        });
      });

      it('should update bounding client rectangle', function() {
        assert.deepEqual(linkTipStore.getBoundingClientRect(), 'boundingClientRect');
      });

      it('should update editor ID', function() {
        assert.equal(linkTipStore.getEditorId(), 'id');
      });
    });
  });

  describe('Actions.LINK_MODAL_ACCEPT', function() {
    describe('when given an incorrect payload', function() {
      it('should throw', function() {
        assert.throws(function() {
          dispatchAction(Actions.LINK_MODAL_ACCEPT);
        });
      });
    });

    describe('when given a valid payload', function() {
      var payload = {
        text: 'text',
        link: 'link',
        openInNewWindow: false
      };

      beforeEach(function() {
        dispatchAction(Actions.LINK_MODAL_ACCEPT, payload);
      });

      it('should emit a change', function(done) {
        linkTipStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_MODAL_ACCEPT, payload);
      });

      it('should update inputs', function() {
        assert.deepEqual(linkTipStore.getInputs(), {
          text: 'text',
          link: 'link',
          openInNewWindow: false
        });
      });
    });
  });

  describe('Actions.LINK_TIP_REMOVE', function() {
    describe('when given no payload', function() {
      it('should emit a change', function(done) {
        linkTipStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_TIP_REMOVE);
      });

      it('should temporarily cause shouldRemoveLink to return true for the specific editor', function() {
        var id = linkTipStore.getEditorId();
        var shouldRemoveLinkReturnedTrue = false;
        // shouldRemoveLink is only true momentarily.
        // This is because RichTextEditorFormatController is
        // eagerly waiting for shouldRemoveLink() to return
        // true for its editor, ready to remove the link
        // immediately.
        linkTipStore.addChangeListener(function() {
          if (linkTipStore.shouldRemoveLink(id)) {
            shouldRemoveLinkReturnedTrue = true;
          }
          assert.isFalse(linkTipStore.shouldRemoveLink('some random ID'));
        });
        dispatchAction(Actions.LINK_TIP_REMOVE);
        assert.isTrue(shouldRemoveLinkReturnedTrue);
        assert.isFalse(linkTipStore.shouldRemoveLink(id));
      });
    });
  });

  describe('Actions.LINK_TIP_CLOSE', function() {
    describe('when given no payload', function() {
      beforeEach(function() {
        dispatchAction(Actions.LINK_TIP_CLOSE);
      });

      it('should emit a change', function(done) {
        linkTipStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_TIP_CLOSE);
      });

      it('should update visibility', function() {
        assert.isFalse(linkTipStore.getVisibility());
      });
    });
  });
});
